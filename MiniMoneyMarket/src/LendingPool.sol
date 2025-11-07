// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

import "./Token/CollateralToken.sol";
import "./Token/MockERC20.sol";
import "./Libraries/InterestRateModel.sol";
import "./Interfaces/IPriceOracle.sol";
import "./Interfaces/ILendingPool.sol";

/// @title LendingPool (Mini Lending & Borrowing)
/// @notice Single collateral token / single borrow token simplified money market.
/// - Users deposit collateral and receive shares (CollateralToken)
/// - Users borrow borrowToken against collateral
/// - Interest is accrued via borrowIndex
/// - Anyone can liquidate undercollateralized accounts
contract LendingPool is ILendingPool, ReentrancyGuard, Ownable {
    using SafeERC20 for MockERC20;

    uint256 public constant WAD = 1e18;

    // Tokens & modules
    MockERC20 public immutable collateralToken; //(e.g., DAI)
    MockERC20 public immutable borrowToken; //(USDC)
    CollateralToken public immutable collateralShare; // ERC20 shares representing deposits
    InterestRateModel public interestModel;
    IPriceOracle public oracle;

    // Accounting
    uint256 public totalCollateral; // raw collateral token amount held in pool
    uint256 public totalBorrows; // borrowToken units outstanding (principal * index)
    uint256 public borrowIndex = WAD; // cumulative interest index (WAD)
    uint256 public lastAccrual;

    // Per-user borrow principal and their index
    mapping(address => uint256) public principalBorrow; // principal at last action (in borrow token)
    mapping(address => uint256) public userBorrowIndex; // borrowIndex at last action

    // Parameters (configurable by owner)
    uint256 public liquidationThreshold = 80e16; // 0.8 WAD -> collateral factor used in max borrow
    uint256 public closeFactor = 5e17; // portion of debt allowed to be repaid by liquidator (0.5)
    uint256 public liquidationIncentive = 105e16; // 1.05 (5% bonus to liquidator)
    uint256 public minBorrow = 1e12; // smallest borrow unit guard

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdraw(address indexed user, uint256 sharesBurned, uint256 amountOut);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event Liquidation(
        address indexed liquidator, address indexed borrower, uint256 repayAmount, uint256 seizedCollateral
    );
    event Accrue(uint256 newIndex, uint256 newTotalBorrows, uint256 elapsed);

    /// @notice Initialize the pool.
    /// @param _collateralToken Underlying token used as collateral (ERC20)
    /// @param _borrowToken Token that users borrow (ERC20)
    /// @param _interestModel Interest rate model contract address
    /// @param _oracle Price oracle address (returns token price in USD WAD)
    constructor(address _collateralToken, address _borrowToken, address _interestModel, address _oracle)
        Ownable(msg.sender)
    {
        require(_collateralToken != address(0) && _borrowToken != address(0), "zero-token");
        collateralToken = MockERC20(_collateralToken);
        borrowToken = MockERC20(_borrowToken);

        collateralShare = new CollateralToken("Collateral Share", "cSHARE");
        
        // initially owned by deployer (owner); 
        //caller may transfer ownership to pool later if desired

        interestModel = InterestRateModel(_interestModel);
        oracle = IPriceOracle(_oracle);
        lastAccrual = block.timestamp;
    }

    // Deposits/withdrawl(shares accounting)

    /// @notice Deposit `amount` of underlying collateral and mint shares to caller.
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "zero-amount");

        // pull collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        // compute shares to mint
        uint256 shares;
        uint256 totalShares = collateralShare.totalSupply();
        if (totalShares == 0 || totalCollateral == 0) {
            // first depositor: 1:1 shares
            shares = amount;
        } else {
            // shares = amount * totalShares / totalCollateral
            shares = (amount * totalShares) / totalCollateral;
        }

        require(shares > 0, "zero-shares");

        totalCollateral += amount;
        collateralShare.mint(msg.sender, shares);

        emit Deposit(msg.sender, amount, shares);
    }

    /// @notice Withdraw `shareAmount` of collateral shares -> burns shares and sends underlying collateral
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "zero-shares");

        uint256 totalShares = collateralShare.totalSupply();
        require(totalShares > 0, "no-shares");

        uint256 amountOut = (shareAmount * totalCollateral) / totalShares;
        require(amountOut > 0, "zero-out");

        // burn shares then transfer collateral
        collateralShare.burn(msg.sender, shareAmount);

        // reduce accounting (do this before health-check to reflect user's reduced collateral)
        totalCollateral -= amountOut;

        // ensure user remains solvent after withdrawal
        (, uint256 borrowUSD, uint256 hf) = _getUserFinancials(msg.sender);
        require(hf >= WAD || borrowUSD == 0, "withdraw-insolvent");

        collateralToken.safeTransfer(msg.sender, amountOut);
        emit Withdraw(msg.sender, shareAmount, amountOut);
    }

    //Borrow/Repay/Accrual

    /// @notice Borrow `amount` of borrowToken (principal). Requires sufficient collateral (LTV).
    function borrow(uint256 amount) external nonReentrant {
        require(amount >= minBorrow, "small-borrow");
        _accrueInterest();

        // compute max borrow in USD based on collateral and threshold
        (uint256 collateralUSD,,) = _getUserFinancials(msg.sender);
        uint256 maxBorrowUSD = (collateralUSD * liquidationThreshold) / WAD;
        uint256 userBorrowUSD = _toUSD(_currentUserBorrowBalance(msg.sender), address(borrowToken));
        uint256 amountUSD = _toUSD(amount, address(borrowToken));

        require(userBorrowUSD + amountUSD <= maxBorrowUSD, "exceeds-ltv");

        // update user accounting (principal set so index math works)
        _updateUserBorrowOnBorrow(msg.sender, amount);

        // transfer borrowed tokens to user
        borrowToken.safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, amount);
    }

    /// @notice Repay up to `amount` of caller's debt.
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "zero");
        _accrueInterest();

        uint256 current = _currentUserBorrowBalance(msg.sender);
        uint256 pay = amount > current ? current : amount;
        require(pay > 0, "no-debt");

        // pull repay tokens
        borrowToken.safeTransferFrom(msg.sender, address(this), pay);

        _updateUserBorrowOnRepay(msg.sender, pay);
        emit Repay(msg.sender, pay);
    }

    //Liquidation

    /// @notice Liquidate an undercollateralized borrower. Caller must approve borrowToken to pool.
    function liquidate(address borrower, uint256 repayAmount) external nonReentrant {
        require(repayAmount > 0, "zero");
        _accrueInterest();

        (, uint256 borrowUSD, uint256 hf) = _getUserFinancials(borrower);
        require(hf < WAD, "healthy");

        // cap repay to closeFactor * borrowUSD
        uint256 maxRepayUSD = (borrowUSD * closeFactor) / WAD;
        uint256 repayUSD = _toUSD(repayAmount, address(borrowToken));
        uint256 actualRepayTokens = repayAmount;

        if (repayUSD > maxRepayUSD) {
            // convert maxRepayUSD -> tokens
            actualRepayTokens = _fromUSD(maxRepayUSD, address(borrowToken));
            repayUSD = maxRepayUSD;
        }

        // pull repay tokens from liquidator
        borrowToken.safeTransferFrom(msg.sender, address(this), actualRepayTokens);

        // reduce borrower's debt
        _updateUserBorrowOnRepay(borrower, actualRepayTokens);

        // seize collateral with liquidation incentive
        uint256 seizeUSD = (repayUSD * liquidationIncentive) / WAD;
        uint256 seizeTokens = _fromUSD(seizeUSD, address(collateralToken));

        // compute shares to burn corresponding to seizeTokens
        uint256 totalShares = collateralShare.totalSupply();
        require(totalShares > 0, "no-shares");

        uint256 sharesToBurn = 0;
        if (totalCollateral > 0) {
            sharesToBurn = (seizeTokens * totalShares) / totalCollateral;
        }

        uint256 borrowerShares = collateralShare.balanceOf(borrower);
        if (sharesToBurn > borrowerShares) {
            sharesToBurn = borrowerShares;
            // recompute seizeTokens from sharesToBurn
            seizeTokens = (sharesToBurn * totalCollateral) / totalShares;
        }

        require(seizeTokens > 0, "seize-zero");

        // burn borrower's shares and transfer underlying to liquidator
        collateralShare.burn(borrower, sharesToBurn);
        totalCollateral -= seizeTokens;
        collateralToken.safeTransfer(msg.sender, seizeTokens);

        emit Liquidation(msg.sender, borrower, actualRepayTokens, seizeTokens);
    }

    // Accounting helpers

    /// @notice Accrue interest to global indexes. Called before mutative actions.
    function _accrueInterest() internal {
        uint256 elapsed = block.timestamp - lastAccrual;
        if (elapsed == 0) return;

        uint256 cash = borrowToken.balanceOf(address(this));
        uint256 ratePerSec = interestModel.getBorrowRatePerSecond(cash, totalBorrows); // WAD per-second

        // newIndex = borrowIndex * (1 + ratePerSec * elapsed)
        uint256 newIndex = (borrowIndex * (WAD + (ratePerSec * elapsed))) / WAD;
        // update total borrows with the same factor
        uint256 newTotalBorrows = (totalBorrows * (WAD + (ratePerSec * elapsed))) / WAD;

        borrowIndex = newIndex;
        totalBorrows = newTotalBorrows;
        lastAccrual = block.timestamp;

        emit Accrue(newIndex, newTotalBorrows, elapsed);
    }

    function _currentUserBorrowBalance(address user) public view returns (uint256) {
        uint256 p = principalBorrow[user];
        if (p == 0) return 0;
        uint256 idx = userBorrowIndex[user];
        if (idx == 0) idx = borrowIndex;
        // balance = principal * borrowIndex / userIndex
        return (p * borrowIndex) / idx;
    }

    function _updateUserBorrowOnBorrow(address user, uint256 amount) internal {
        // compute current balance, add amount as principal 
        //and set user's index to current borrowIndex
        uint256 curr = _currentUserBorrowBalance(user);
        uint256 newPrincipal = curr + amount;
        principalBorrow[user] = newPrincipal;
        userBorrowIndex[user] = borrowIndex;
        totalBorrows += amount;
    }

    function _updateUserBorrowOnRepay(address user, uint256 amount) internal {
        uint256 curr = _currentUserBorrowBalance(user);
        if (amount >= curr) {
            // fully repaid
            totalBorrows -= curr;
            principalBorrow[user] = 0;
            userBorrowIndex[user] = 0;
        } else {
            uint256 newBal = curr - amount;
            //newBal = principal * borrowIndex / borrowIndex => principal = newBal
            principalBorrow[user] = newBal;
            userBorrowIndex[user] = borrowIndex;
            totalBorrows -= amount;
        }
    }

    /// @notice Compute collateral value (USD WAD), borrow value (USD WAD) and hf
    function _getUserFinancials(address user)
        internal
        view
        returns (uint256 collateralUSD, uint256 borrowUSD, uint256 healthFactor)
    {
        // underlying collateral tokens owned by user via shares
        uint256 userShares = collateralShare.balanceOf(user);
        uint256 totalShares = collateralShare.totalSupply();
        uint256 userCollateralTokens = 0;
        if (totalShares > 0) {
            userCollateralTokens = (userShares * totalCollateral) / totalShares;
        }
        uint256 collPrice = oracle.getTWAP(address(collateralToken), 1800);  // reverts if stale
        collateralUSD = (userCollateralTokens * collPrice) / WAD;

        uint256 borrowTokens = _currentUserBorrowBalance(user);
        uint256 borrowPrice = oracle.getTWAP(address(borrowToken), 1800);
        borrowUSD = (borrowTokens * borrowPrice) / WAD;

        if (borrowUSD == 0) {
            healthFactor = type(uint256).max;
        } else {
            healthFactor = (collateralUSD * liquidationThreshold) / borrowUSD;
        }
        return (collateralUSD, borrowUSD, healthFactor);
    }

    //Public getters & helpers

    /// @notice Public wrapper to get user account data
    function getUserAccountData(address user)
        external
        view
        override
        returns (uint256 collateralUSD, uint256 borrowUSD, uint256 healthFactor)
    {
        return _getUserFinancials(user);
    }

    /// @notice Convert token amount to USD (WAD) using oracle. Reverts on stale/zero price.
    function _toUSD(uint256 tokenAmount, address token) internal view returns (uint256) {
        uint256 p = oracle.getTWAP(token, 1800);
        return (tokenAmount * p) / WAD;
    }

    /// @notice Convert USD (WAD) to token amount given oracle price.
    function _fromUSD(uint256 usdAmount, address token) internal view returns (uint256) {
        uint256 p = oracle.getTWAP(token, 1800);
        require(p > 0, "zero-price");
        return (usdAmount * WAD) / p;
    }

    //Admin setters
    function setInterestModel(address _interestModel) external onlyOwner {
        interestModel = InterestRateModel(_interestModel);
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = IPriceOracle(_oracle);
    }

    function setLiquidationThreshold(uint256 v) external onlyOwner {
        require(v <= WAD, "bad-threshold");
        liquidationThreshold = v;
    }

    function setCloseFactor(uint256 v) external onlyOwner {
        require(v <= WAD, "bad-close");
        closeFactor = v;
    }

    function setLiquidationIncentive(uint256 v) external onlyOwner {
        require(v >= WAD, "incentive-bad");
        liquidationIncentive = v;
    }

    function setMinBorrow(uint256 v) external onlyOwner {
        minBorrow = v;
    }
}


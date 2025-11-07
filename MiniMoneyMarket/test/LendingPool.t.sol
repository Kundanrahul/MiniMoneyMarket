// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/LendingPool.sol";
import "../src/PriceOracle.sol";
import "../src/Libraries/InterestRateModel.sol";
import "../src/Token/MockERC20.sol";

contract LendingPoolTest is Test {
    LendingPool pool;
    MockERC20 collateral;
    MockERC20 debt;
    PriceOracle oracle;
    InterestRateModel irm;

    address user = address(0xABCD);

    function setUp() public {
        // Deploy mock tokens
        collateral = new MockERC20("Mock DAI", "mDAI", 18);
        debt = new MockERC20("Mock USDC", "mUSDC", 18);

        // Deploy oracle & IRM
        oracle = new PriceOracle();
        irm = new InterestRateModel(0.02e18, 1e18);

        //staleness check disabled for tests
        oracle.setStalenessCheckEnabled(false);

        //mock prices (1 token = $1)
        oracle.setPrice(address(collateral), 1e18);
        oracle.setPrice(address(debt), 1e18);

        // Deploying LendingPool
        pool = new LendingPool(
            address(collateral),
            address(debt),
            address(irm),
            address(oracle)
        );

        // Minted tokens to user & pool
        collateral.mint(user, 1000e18);
        debt.mint(address(pool), 1000e18);

        // Approved pool
        vm.startPrank(user);
        collateral.approve(address(pool), type(uint256).max);
        vm.stopPrank();
    }

    function testDeposit() public {
        vm.startPrank(user);
        pool.deposit(100e18);
        vm.stopPrank();

        (uint256 coll, , ) = pool.getUserAccountData(user);
        assertGt(coll, 0, "collateral should increase after deposit");
    }

    function testBorrowAndRepay() public {
        vm.startPrank(user);
        pool.deposit(200e18);
        pool.borrow(50e18);
        debt.approve(address(pool), 50e18);
        pool.repay(50e18);
        vm.stopPrank();

        (, uint256 borrow, ) = pool.getUserAccountData(user);
        assertEq(borrow, 0, "should have no outstanding borrow after full repay");
    }

    function testWithdraw() public {
        vm.startPrank(user);
        pool.deposit(100e18);
        pool.withdraw(50e18);
        vm.stopPrank();

        (uint256 coll, , ) = pool.getUserAccountData(user);
        assertApproxEqAbs(coll, 50e18, 1e14, "should have remaining collateral");
    }
}




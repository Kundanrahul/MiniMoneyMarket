// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/LendingPool.sol";
import "../src/PriceOracle.sol";
import "../src/Libraries/InterestRateModel.sol";
import "../src/Token/MockERC20.sol";

contract LiquidationTest is Test {
    LendingPool pool;
    MockERC20 collateral;
    MockERC20 debt;
    PriceOracle oracle;
    InterestRateModel irm;

    address borrower = address(0xBEEF);
    address liquidator = address(0xCAFE);

    function setUp() public {
        // mock tokens
        collateral = new MockERC20("Mock ETH", "mETH",18);
        debt = new MockERC20("Mock USDC", "mUSDC",18);

        oracle = new PriceOracle();
        irm = new InterestRateModel(0.02e18,1e18);

        // Disabled staleness,just for tests
        oracle.setStalenessCheckEnabled(false);

        //initial prices
        oracle.setPrice(address(collateral), 2000e18); // 1 ETH = $2000
        oracle.setPrice(address(debt), 1e18);          // 1 USDC = $1

        // Deploying LendingPool
        pool = new LendingPool(
            address(collateral),
            address(debt),
            address(irm),
            address(oracle)
        );

        // Minted & approved tokens
        collateral.mint(borrower, 10e18);
        debt.mint(address(pool), 20000e18);       //more liquidity for bigger borrow
        debt.mint(liquidator, 20000e18);

        vm.startPrank(borrower);
        collateral.approve(address(pool), type(uint256).max);
        pool.deposit(10e18);
        pool.borrow(15000e18); // borrow more to make HF < 1 after crash
        vm.stopPrank();
    }

    function testLiquidation() public {
        // Simulate price crash
        oracle.setPrice(address(collateral), 500e18); // ETH drops to $500

        vm.startPrank(liquidator);
        debt.approve(address(pool), type(uint256).max);
        pool.liquidate(borrower, 5000e18); // liquidate partially
        vm.stopPrank();

        (, uint256 borrow, uint256 hf) = pool.getUserAccountData(borrower);

        // HF should now be below 1
        assertLt(hf, 1e18, "borrower should be below healthy HF");
        assertLt(borrow, 15000e18, "borrow should decrease after liquidation");
    }
}





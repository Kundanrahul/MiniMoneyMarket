// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/Token/MockERC20.sol";
import "../src/LendingPool.sol";
import "../src/PriceOracle.sol";
import "../src/Libraries/InterestRateModel.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        //1.Deployed mock tokens
        MockERC20 dai = new MockERC20("Mock DAI", "mDAI", 18);
        MockERC20 usdc = new MockERC20("Mock USDC", "mUSDC", 6);

        //2.Deployed oracle
        PriceOracle oracle = new PriceOracle();
        oracle.setPrice(address(dai), 1e18);  // $1
        oracle.setPrice(address(usdc), 1e18); // $1

        //Deployed interest rate model
        InterestRateModel interestModel = new InterestRateModel(
            0.02e18, // 2% base rate
            1e18     // 100% slope rate
        );

        //Deployed LendingPool with correct tokens
        LendingPool pool = new LendingPool(
            address(dai),        // collateralToken (MockDAI)
            address(usdc),       // borrowToken (MockUSDC)
            address(interestModel),
            address(oracle)
        );

        vm.stopBroadcast();

        // Log all addresses(for my own reference)
        console.log("Deployment complete!");
        console.log("Mock DAI:", address(dai));
        console.log("Mock USDC:", address(usdc));
        console.log("Lending Pool:", address(pool));
        console.log("Price Oracle:", address(oracle));
        console.log("Interest Model:", address(interestModel));
        console.log("Collateral Share (created inside pool):", address(pool.collateralShare()));
    }
}




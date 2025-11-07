// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/Token/MockERC20.sol";

/// @notice Script to mint initial balances for testing or Sepolia
contract SetupTokensScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address user = 0xbEDDB491255cc57e07Ae15acc1CAEAc1df1F0E39;

        // Latest deployed Mock tokens
        MockERC20 dai = MockERC20(0x98fBe6687dF5843143Ec1CdC7Ff37C714F0B6963);
        MockERC20 usdc = MockERC20(0x82903D8934c2DDD78Ea403e53608E67d3E1a7070);

        // Mint
        dai.mint(user, 10_000 ether);   // 10,000 DAI
        usdc.mint(user, 10_000 ether);  // 10,000 USDC

        vm.stopBroadcast();
    }
}

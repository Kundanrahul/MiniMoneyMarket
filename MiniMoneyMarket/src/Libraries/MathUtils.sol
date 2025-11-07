// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title MathUtils
/// @notice Small fixed-point helpers using WAD (1e18)
library MathUtils {
    uint256 internal constant WAD = 1e18;

    function wadMul(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * b) / WAD;
    }

    function wadDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "MathUtils:div-by-zero");
        return (a * WAD) / b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }
}

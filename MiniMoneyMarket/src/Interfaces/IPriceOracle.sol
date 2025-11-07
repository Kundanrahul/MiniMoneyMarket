// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title IPriceOracle
/// @notice Minimal oracle abstraction used by the pool. Prices are returned with 1e18 precision (WAD).
interface IPriceOracle {
    /// @notice Return price of `token` in USD with 18 decimals (WAD). e.g., 1 DAI -> 1e18
    function getPrice(address token) external view returns (uint256);

    /// @notice Returns the last update timestamp for the token price
    function getLastUpdate(address token) external view returns (uint256);

    /// @notice Returns TWAP of `token` over the given interval (in seconds)
    function getTWAP(address token, uint256 interval) external view returns (uint256);
}
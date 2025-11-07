// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title InterestRateModel
/// @notice Simple linear utilization-based interest model.
/// ratePerYear = baseRatePerYear + slopePerYear * utilization
contract InterestRateModel {
    uint256 public immutable baseRatePerYear; // e.g., 0.02e18 = 2%
    uint256 public immutable slopePerYear; // e.g., 1e18 = 100%
    uint256 internal constant YEAR = 365 days;
    uint256 internal constant WAD = 1e18;

    constructor(uint256 _baseRatePerYear, uint256 _slopePerYear) {
        baseRatePerYear = _baseRatePerYear;
        slopePerYear = _slopePerYear;
    }

    /// @notice Calculates utilization = totalBorrows / (totalCash + totalBorrows)
    /// @return utilization scaled by 1e18
    function _getUtilization(uint256 totalCash, uint256 totalBorrows) internal pure returns (uint256) {
        if (totalBorrows == 0) return 0;
        uint256 denom = totalCash + totalBorrows;
        if (denom == 0) return 0;
        return (totalBorrows * WAD) / denom;
    }

    /// @notice Returns the borrow rate per second (scaled by 1e18)
    function getBorrowRatePerSecond(uint256 totalCash, uint256 totalBorrows) external view returns (uint256) {
        uint256 util = _getUtilization(totalCash, totalBorrows);
        // Linear model: ratePerYear = base + slope * util
        uint256 ratePerYear = baseRatePerYear + ((slopePerYear * util) / WAD);
        // Convert annual rate to per-second rate
        return ratePerYear / YEAR;
    }

    /// @notice Returns borrow rate per year
    function getBorrowRatePerYear(uint256 totalCash, uint256 totalBorrows) external view returns (uint256) {
        uint256 util = _getUtilization(totalCash, totalBorrows);
        return baseRatePerYear + ((slopePerYear * util) / WAD);
    }
}


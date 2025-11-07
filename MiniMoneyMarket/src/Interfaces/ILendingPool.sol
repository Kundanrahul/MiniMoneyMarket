// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface ILendingPool {
    /// @notice deposit `amount` of collateralToken into the pool for msg.sender
    function deposit(uint256 amount) external;

    /// @notice withdraw `shareAmount` of collateral shares (or underlying equivalent)
    function withdraw(uint256 shareAmount) external;

    /// @notice borrow `amount` of borrowToken against caller's collateral
    function borrow(uint256 amount) external;

    /// @notice repay `amount` of borrowToken for caller (partial or full)
    function repay(uint256 amount) external;

    /// @notice liquidate `borrower` by repaying up to `repayAmount` tokens and seizing collateral
    function liquidate(address borrower, uint256 repayAmount) external;

    /// @notice return user account data (collateralUSD, borrowUSD, healthFactor)
    function getUserAccountData(address user)
        external
        view
        returns (uint256 collateralUSD, uint256 borrowUSD, uint256 healthFactor);
}

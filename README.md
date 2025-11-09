# 🏦 MiniMoneyMarket

A minimal lending and borrowing protocol built in Solidity using Foundry. Users can deposit collateral, borrow stablecoins, repay loans, and trigger liquidations — all secured by a custom TWAP-enabled price oracle.

---

## ✨ Features

- Single collateral / single borrow token setup
- ERC20-based collateral shares (`CollateralToken`)
- Interest accrual via dynamic rate model
- Liquidation logic with close factor and incentive
- Custom `PriceOracle` with TWAP support
- Security-aware design (reentrancy guard, SafeERC20, staleness checks)

---

## 🧱 Architecture

| Component         | Description |
|------------------|-------------|
| `LendingPool.sol` | Core lending logic: deposit, borrow, repay, withdraw, liquidate |
| `CollateralToken.sol` | ERC20 shares representing deposited collateral |
| `MockERC20.sol`   | Simplified ERC20 tokens for testing (collateral and borrow) |
| `PriceOracle.sol` | Admin-controlled oracle with TWAP computation |
| `InterestRateModel.sol` | Per-second interest rate curve based on utilization |

---

## 🔐 Security

- Reentrancy protected via `ReentrancyGuard`
- Oracle staleness checks and TWAP smoothing
- Manual audit folder included with Slither and gas reports
- No upgradeability or proxy patterns (static contracts)
- 📄 [Full Security Report](https://github.com/Kundanrahul/audit-report/blob/main/MiniMoneyMarket)


---

## 🧪 Testing

- Written in Foundry (`forge test`)
- Includes unit tests for:
  - Interest rate curve
  - Deposit/withdraw logic
  - Borrow/repay flow
  - Liquidation edge cases
- Gas snapshot via `forge snapshot`

---

## 🧠 TWAP Integration

TWAP (Time-Weighted Average Price) is used to prevent flash loan manipulation:
- Oracle stores cumulative price data
- LendingPool uses TWAP for:
  - Collateral valuation
  - Borrow limits
  - Liquidation triggers

---

## 🚀 Getting Started

```bash
forge install
forge build
forge test

"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useLendingPool } from "../app/hooks/useContract";
import { CONTRACTS } from "../app/lib/contracts";
import CollateralTokenABI from "../app/abis/CollateralToken.json";
import LendingPoolABI from "../app/abis/LendingPool.json";

export default function UserDashboard() {
  const pool = useLendingPool();
  const { address } = useAccount();

  const [depositedDAI, setDepositedDAI] = useState<bigint>(0n);
  const [borrowedUSDC, setBorrowedUSDC] = useState<bigint>(0n);
  const [error, setError] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      if (!pool || !address) return;

      const provider = new ethers.BrowserProvider((window as any).ethereum);

      const lendingPool = new ethers.Contract(
        CONTRACTS.LendingPool.address,
        LendingPoolABI,
        provider
      );

      const collateralShareAddress: string = await lendingPool.collateralShare();
      const collateralShare = new ethers.Contract(
        collateralShareAddress,
        CollateralTokenABI,
        provider
      );

      // Collateral shares → underlying DAI
      const userShares: bigint = await collateralShare.balanceOf(address);
      const totalShares: bigint = await collateralShare.totalSupply();
      const totalCollateral: bigint = await lendingPool.totalCollateral();

      let userCollateralTokens = 0n;
      if (totalShares > 0n) {
        userCollateralTokens = (userShares * totalCollateral) / totalShares;
      }
      setDepositedDAI(userCollateralTokens);

      // Borrowed USDC
      const p: bigint = await lendingPool.principalBorrow(address);

      if (p === 0n) {
        setBorrowedUSDC(0n);
      } else {
        let userIdx: bigint = await lendingPool.userBorrowIndex(address);
        const globalIdx: bigint = await lendingPool.borrowIndex();

        if (userIdx === 0n) userIdx = globalIdx;

        const currentDebt: bigint = (p * globalIdx) / userIdx; // 6 decimals
        setBorrowedUSDC(currentDebt);
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.reason || err.message || "Failed to fetch user data.");
    }
  }, [pool, address]);

  // Initial load + polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Event listeners for instant updates
  useEffect(() => {
    if (!address) return;

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const lendingPool = new ethers.Contract(
      CONTRACTS.LendingPool.address,
      LendingPoolABI,
      provider
    );

    const updateOnEvent = (user: string) => {
      if (user.toLowerCase() === address.toLowerCase()) {
        fetchData();
      }
    };

    lendingPool.on("Deposit", updateOnEvent);
    lendingPool.on("Withdraw", updateOnEvent);
    lendingPool.on("Borrow", updateOnEvent);
    lendingPool.on("Repay", updateOnEvent);

    return () => {
      lendingPool.removeAllListeners("Deposit");
      lendingPool.removeAllListeners("Withdraw");
      lendingPool.removeAllListeners("Borrow");
      lendingPool.removeAllListeners("Repay");
    };
  }, [address, fetchData]);

  return (
    <div className="p-4 sm:p-6 w-full max-w-xs sm:max-w-md rounded-xl glass text-white backdrop-blur-lg bg-white/10 border border-white/20 shadow-lg text-sm sm:text-base">
      <h2 className="text-lg sm:text-xl font-semibold text-center tracking-wide mb-0.5">
        Your Account
      </h2>

      {error ? (
        <p className="text-red-400 text-center text-xs sm:text-sm">{error}</p>
      ) : (
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-xs sm:text-base">
            💎 <span className="font-medium">Deposited:</span>{" "}
            {ethers.formatUnits(depositedDAI || 0n, 18)} DAI
          </p>
          <p className="text-xs sm:text-base">
            💰 <span className="font-medium">Borrowed:</span>{" "}
            {ethers.formatUnits(borrowedUSDC || 0n, 6)} USDC
          </p>
        </div>
      )}
    </div>
  );
}






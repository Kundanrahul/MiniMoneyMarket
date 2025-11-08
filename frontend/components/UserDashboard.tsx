"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount, usePublicClient } from "wagmi";
import { useLendingPool } from "../app/hooks/useContract";
import { CONTRACTS } from "../app/lib/contracts";
import CollateralTokenABI from "../app/abis/CollateralToken.json";
import LendingPoolABI from "../app/abis/LendingPool.json"; // ensure this includes principalBorrow, userBorrowIndex, borrowIndex

export default function UserDashboard() {
  const pool = useLendingPool();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [depositedDAI, setDepositedDAI] = useState<bigint>(0n);
  const [borrowedUSDC, setBorrowedUSDC] = useState<bigint>(0n);
  const [error, setError] = useState<string>("");

  const fetchData = async () => {
    try {
      if (!pool || !address || !publicClient) return;
      const provider = new ethers.JsonRpcProvider(publicClient.transport.url);

      // 1) Deposited DAI via shares → underlying tokens
      const collateralShare = new ethers.Contract(
        CONTRACTS.CollateralToken.address,
        CollateralTokenABI,
        provider
      );

      const userShares: bigint = await collateralShare.balanceOf(address);
      const totalShares: bigint = await collateralShare.totalSupply();
      const totalCollateral: bigint = await pool.totalCollateral();

      let userCollateralTokens = 0n;
      if (totalShares > 0n) {
        userCollateralTokens = (userShares * totalCollateral) / totalShares;
      }
      setDepositedDAI(userCollateralTokens);

      // 2) Borrowed USDC using pool’s accounting (principalBorrow, userBorrowIndex, borrowIndex)
      const lendingPool = new ethers.Contract(
        CONTRACTS.LendingPool.address, // 0xb6509579... your pool address
        LendingPoolABI,
        provider
      );

      const p: bigint = await lendingPool.principalBorrow(address);
      if (p === 0n) {
        setBorrowedUSDC(0n);
      } else {
        let userIdx: bigint = await lendingPool.userBorrowIndex(address);
        const globalIdx: bigint = await lendingPool.borrowIndex();

        // If userIdx is zero, default to current borrowIndex (matches contract logic)
        if (userIdx === 0n) userIdx = globalIdx;

        const currentDebt: bigint = (p * globalIdx) / userIdx; // raw USDC units (6 decimals)
        setBorrowedUSDC(currentDebt);
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.reason || err.message || "Failed to fetch user data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [pool, address, publicClient]);

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





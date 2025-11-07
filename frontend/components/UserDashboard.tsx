"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useLendingPool } from "../app/hooks/useContract";

export default function UserDashboard() {
  const pool = useLendingPool();
  const { address } = useAccount();

  const [collateral, setCollateral] = useState<bigint>(0n);
  const [borrowed, setBorrowed] = useState<bigint>(0n);
  const [error, setError] = useState<string>("");

  const fetchData = async () => {
    try {
      if (!pool || !address) return;

      const data = await (pool as any).getUserAccountData(address);

      if (data?.collateralAmount !== undefined && data?.borrowAmount !== undefined) {
        setCollateral(BigInt(data.collateralAmount));
        setBorrowed(BigInt(data.borrowAmount));
      } else if (Array.isArray(data) && data.length >= 2) {
        setCollateral(BigInt(data[0]));
        setBorrowed(BigInt(data[1]));
      } else {
        setError("Unexpected contract response format.");
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.reason || err.message || "Failed to fetch user data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [pool, address]);

  return (
    <div className="p-4 sm:p-6 w-full max-w-xs sm:max-w-md rounded-xl glass text-white backdrop-blur-lg bg-white/10 border border-white/20 shadow-lg text-sm sm:text-base">
      <h2 className="text-lg sm:text-xl font-semibold text-center tracking-wide">
        Your Account
      </h2>

      {error ? (
        <p className="text-red-400 text-center text-xs sm:text-sm">{error}</p>
      ) : (
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-xs sm:text-base">
            💎 <span className="font-medium">Collateral:</span>{" "}
            {ethers.formatUnits(collateral || 0n, 18)} DAI
          </p>
          <p className="text-xs sm:text-base">
            💰 <span className="font-medium">Borrowed:</span>{" "}
            {ethers.formatUnits(borrowed || 0n, 6)} USDC
          </p>
        </div>
      )}
    </div>
  );
}





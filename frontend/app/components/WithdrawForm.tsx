"use client";

import { useState } from "react";
import { useLendingPool, useCollateralToken } from "../hooks/useContract";
import { ethers } from "ethers";

export default function WithdrawForm() {
  const pool = useLendingPool();
  const collateralShare = useCollateralToken();
  const [shares, setShares] = useState("");

  const handleWithdraw = async () => {
    if (!pool || !collateralShare) return alert("Wallet not connected");
    if (!shares || Number(shares) <= 0) return alert("Enter shares to burn");

    try {
      const shareAmt = ethers.parseUnits(shares, await collateralShare.decimals?.() ?? 18);
      const tx = await pool.withdraw(shareAmt);
      await tx.wait();
      alert("Withdraw successful ✅");
      setShares("");
    } catch (err: any) {
      console.error(err);
      alert("Withdraw failed: " + (err?.message ?? err));
    }
  };

  return (
    <div className="glass p-6 rounded-2xl max-w-md w-full shadow-lg transition duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-sans">
      <h3 className="text-white text-xl font-semibold mb-3 font-sans">
        Withdraw Collateral (shares)
      </h3>
      <input
        type="number"
        step="any"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        placeholder="Shares amount"
        className="w-full p-3 rounded-lg bg-white/10 outline-none text-white placeholder-gray-300 mb-4 font-sans"
      />
      <button
        onClick={handleWithdraw}
        className="w-full py-2 rounded-lg bg-linear-to-r from-pink-500 to-red-500 text-white font-medium transition duration-300 hover:brightness-110 hover:shadow-lg font-sans"
      >
        Withdraw
      </button>
    </div>
  );
}

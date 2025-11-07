"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ethers } from "ethers";
import { useLendingPool, useMockUSDC, useProviderAndSigner } from "../hooks/useContract";

// types
import { LendingPool } from "../types/LendingPool";
import { MockERC20 } from "../types/MockERC20";

export default function BorrowForm() {
  const pool = useLendingPool() as LendingPool | null;
  const borrowToken = useMockUSDC() as MockERC20 | null;
  const { signer, account } = useProviderAndSigner();

  const [amount, setAmount] = useState("");

  const handleBorrow = async () => {
    if (!pool || !borrowToken || !signer || !account) {
      return toast.error("Wallet not connected or contracts missing");
    }
    if (!amount || Number(amount) <= 0) {
      return toast.error("Enter an amount greater than 0");
    }

    try {
      const decimalsBigInt = await borrowToken.decimals?.() ?? 18n;
      const decimals = Number(decimalsBigInt);
      const amt = ethers.parseUnits(amount, decimals);

      const chainMin: bigint = await pool.minBorrow();

      if (amt < chainMin) {
        const minHuman = Number(chainMin) / 10 ** decimals;
        return toast.error(`Borrow amount must be at least ${minHuman} USDC`);
      }

      const [collateralUSD, borrowUSD] = await pool.getUserAccountData(account);
      const liquidationThreshold: bigint = await pool.liquidationThreshold();
      const maxBorrowUSD = (collateralUSD * liquidationThreshold) / 10n ** 18n;

      const amountUSD = Number(amount);

      if (Number(borrowUSD) / 1e18 + amountUSD > Number(maxBorrowUSD) / 1e18) {
        const maxHuman = Number(maxBorrowUSD) / 1e18;
        return toast.error(`Borrow exceeds max allowed. You can borrow up to ${maxHuman} USDC`);
      }

      toast.loading("Borrowing...", { id: "borrow" });
      const tx = await pool.connect(signer).borrow(amt);
      await tx.wait();
      toast.success("Borrow successful ✅", { id: "borrow" });

      setAmount("");
    } catch (err: any) {
      console.error("Borrow failed with error:", err);
      toast.error("Borrow failed: " + (err?.reason ?? err?.message ?? err), { id: "borrow" });
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="glass p-6 rounded-2xl max-w-md w-full shadow-lg transition duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-sans">
        <h3 className="text-white text-xl font-semibold mb-3 font-sans">Borrow</h3>
        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to borrow"
          className="w-full p-3 rounded-lg bg-white/10 outline-none text-white placeholder-gray-300 mb-4 font-sans"
        />
        <button
          onClick={handleBorrow}
          className="w-full py-2 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 text-white font-medium transition duration-300 hover:brightness-110 hover:shadow-lg font-sans"
        >
          Borrow
        </button>
      </div>
    </>
  );
}


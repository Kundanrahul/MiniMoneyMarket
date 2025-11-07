"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLendingPool, useTokenByAddress } from "../app/hooks/useContract";
import { CONTRACTS } from "../app/lib/contracts";
import { ethers } from "ethers";

export default function RepayForm() {
  const pool = useLendingPool();
  const borrowAddr = CONTRACTS.MockUSDC.address;
  const borrowToken = useTokenByAddress(borrowAddr);

  const [amount, setAmount] = useState("");

  const handleRepay = async () => {
    if (!pool || !borrowToken) {
      return toast.error("Wallet or contracts missing");
    }
    if (!amount || Number(amount) <= 0) {
      return toast.error("Enter an amount greater than 0");
    }

    try {
      const decimals = await borrowToken.decimals();
      const amt = ethers.parseUnits(amount, Number(decimals));

      toast.loading("Approving token...", { id: "repay" });
      const approveTx = await borrowToken.approve(await pool.getAddress(), amt);
      await approveTx.wait();

      toast.loading("Repaying debt...", { id: "repay" });
      const tx = await pool.repay(amt);
      await tx.wait();

      toast.success("✅ Repay successful!", { id: "repay" });
      setAmount("");
    } catch (err: any) {
      console.error("Repay failed:", err);
      toast.error("❌ Repay failed: " + (err?.reason || err?.message || err), { id: "repay" });
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="glass p-6 rounded-2xl max-w-md w-full shadow-lg transition duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-sans">
        <h3 className="text-white text-xl font-semibold mb-3 font-sans">Repay Debt</h3>

        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to repay"
          className="w-full p-3 rounded-lg bg-white/10 outline-none text-white placeholder-gray-300 mb-4 font-sans"
        />

        <button
          onClick={handleRepay}
          className="w-full py-2 rounded-lg bg-linear-to-r from-yellow-500 to-orange-500 text-white font-medium transition duration-300 hover:brightness-110 hover:shadow-lg font-sans"
        >
          Repay
        </button>
      </div>
    </>
  );
}
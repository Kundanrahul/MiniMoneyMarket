"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ethers } from "ethers";
import { useLendingPool, useMockDAI, useProviderAndSigner } from "../hooks/useContract";

//types/typechain
import { MockERC20 } from "../types/MockERC20";
import { LendingPool } from "../types/LendingPool";

export default function DepositForm() {
  const pool = useLendingPool() as LendingPool | null;
  const dai = useMockDAI() as MockERC20 | null;
  const { signer, account } = useProviderAndSigner();

  const [amount, setAmount] = useState("");

  const handleDeposit = async () => {
    if (!pool || !dai || !signer || !account) {
      return toast.error("Wallet not connected or contracts missing");
    }

    if (!amount || Number(amount) <= 0) {
      return toast.error("Enter an amount greater than 0");
    }

    try {
      console.log("Connected account:", account);
      console.log("Token contract address:", dai?.target);
      console.log("Pool contract address:", pool?.target);
      console.log("Chain ID:", await signer.provider?.getNetwork());

      const decimalsBigInt = await dai.decimals?.() ?? 18n;
      const decimals = Number(decimalsBigInt);
      const amt = ethers.parseUnits(amount, decimals);

      const balance: bigint = await dai.balanceOf(account);
      console.log("Token balance:", balance.toString(), "Required:", amt.toString());

      if (balance < amt) {
        return toast.error("Insufficient token balance");
      }

      const allowance: bigint = await dai.allowance(account, pool.target);
      console.log("Allowance:", allowance.toString());

      if (allowance < amt) {
        toast.loading("Approving tokens...", { id: "deposit" });
        const approveTx = await dai.connect(signer).approve(pool.target, amt);
        await approveTx.wait();
        toast.success("Approval successful ✅", { id: "deposit" });
      }

      toast.loading("Depositing...", { id: "deposit" });
      const depositTx = await pool.connect(signer).deposit(amt);
      await depositTx.wait();
      toast.success("Deposit successful ✅", { id: "deposit" });

      setAmount("");
    } catch (err: any) {
      console.error(err);
      toast.error("Deposit failed: " + (err?.reason ?? err?.message ?? err), { id: "deposit" });
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="glass p-6 rounded-2xl max-w-md w-full shadow-lg transition duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-sans">
        <h3 className="text-white text-xl font-semibold mb-3">
          Deposit Collateral (MockDAI)
        </h3>

        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (token decimals)"
          className="w-full p-3 rounded-lg bg-white/10 outline-none text-white placeholder-gray-300 mb-4 font-sans"
        />

        <div className="flex gap-3">
          <button
            onClick={handleDeposit}
            className="flex-1 py-2 rounded-lg bg-linear-to-r from-indigo-500 to-blue-500 text-white font-medium transition duration-300 hover:brightness-110 hover:shadow-lg font-sans"
          >
            Deposit
          </button>
        </div>
      </div>
    </>
  );
}







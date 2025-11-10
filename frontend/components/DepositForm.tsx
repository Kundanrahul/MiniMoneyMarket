"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ethers } from "ethers";
import { useLendingPool, useMockDAI, useProviderAndSigner } from "../app/hooks/useContract";

// types/typechain
import { MockERC20 } from "../app/types/MockERC20";
import { LendingPool } from "../app/types/LendingPool";

const SWAPPER_ADDRESS = "0xE36696DCEfdaC47d9Ec2bBB318EEA930524ee3fE";

// Match backend constant: 1 DAI = 0.00001 ETH
const ETH_PER_DAI = ethers.parseEther("0.00001");

interface DepositFormProps {
  onDepositComplete?: () => void; // optional callback to refresh dashboard
}

export default function DepositForm({ onDepositComplete }: DepositFormProps) {
  const pool = useLendingPool() as LendingPool | null;
  const dai = useMockDAI() as MockERC20 | null;
  const { signer, account } = useProviderAndSigner();

  const [amount, setAmount] = useState("");

  const handleDeposit = async () => {
    if (!pool || !dai || !signer || !account) {
      return toast.error("⚠️ Wallet not connected or contracts missing");
    }
    if (!amount || Number(amount) <= 0) {
      return toast.error("✍️ Enter an amount greater than 0");
    }

    try {
      const amt = ethers.parseUnits(amount, 18);

      // Check wallet balance
      let balance: bigint = await dai.balanceOf(account);
      console.log("Wallet MockDAI balance before deposit:", balance.toString());

      // If insufficient balance, auto-swap ETH → MockDAI
      if (balance < amt) {
        const requiredEth = (amt * ETH_PER_DAI) / ethers.parseUnits("1", 18);
        const ethHuman = ethers.formatEther(requiredEth);

        toast.loading(`🔄 Swapping ${ethHuman} Sepolia ETH for MockDAI...`, { id: "swap" });
        const swapTx = await signer.sendTransaction({
          to: SWAPPER_ADDRESS,
          value: requiredEth,
        });
        console.log("Swap tx hash:", swapTx.hash);
        await swapTx.wait();
        toast.success("✅ Swap complete! You now have MockDAI", { id: "swap" });

        // Refresh balance
        balance = await dai.balanceOf(account);
        console.log("Wallet MockDAI balance after swap:", balance.toString());
        if (balance < amt) {
          return toast.error("❌ Swap did not yield enough MockDAI");
        }
      }

      // Approve if needed
      const allowance: bigint = await dai.allowance(account, pool.target);
      console.log("Current allowance:", allowance.toString());
      if (allowance < amt) {
        toast.loading("🔑 Approving tokens...", { id: "deposit" });
        const approveTx = await dai.connect(signer).approve(pool.target, ethers.MaxUint256);
        console.log("Approve tx hash:", approveTx.hash);
        await approveTx.wait();
        toast.success("✅ Approval granted", { id: "deposit" });
      }

      // Deposit
      toast.loading("📥 Depositing MockDAI...", { id: "deposit" });
      const depositTx = await pool.connect(signer).deposit(amt);
      console.log("Deposit tx hash:", depositTx.hash);
      await depositTx.wait();
      toast.success("🎉 Deposit successful!", { id: "deposit" });

      const balanceAfter: bigint = await dai.balanceOf(account);
      console.log("Wallet MockDAI balance after deposit:", balanceAfter.toString());

      setAmount("");

      if (onDepositComplete) {
        onDepositComplete();
      }
    } catch (err: any) {
      console.error("Deposit failed:", err);
      toast.error("❌ Deposit failed: " + (err?.reason ?? err?.message ?? err), {
        id: "deposit",
      });
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
          placeholder="Amount (DAI)"
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







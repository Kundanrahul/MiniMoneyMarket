"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAccount, usePublicClient } from "wagmi";
import { useLendingPool } from "../app/hooks/useContract";
import { CONTRACTS } from "../app/lib/contracts";
import LendingPoolABI from "../app/abis/LendingPool.json";
import InterestRateModelABI from "../app/abis/InterestRateModel.json";

export default function RiskHealthCard() {
  const pool = useLendingPool();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [hf, setHf] = useState<bigint>(0n);
  const [aprPercent, setAprPercent] = useState<number>(0);
  const [apyPercent, setApyPercent] = useState<number>(0);

  const fetchData = async () => {
    if (!pool || !publicClient || !address) return;
    const provider = new ethers.JsonRpcProvider(publicClient.transport.url);
    const lendingPool = new ethers.Contract(CONTRACTS.LendingPool.address, LendingPoolABI, provider);

    // Health factor
    const data = await lendingPool.getUserAccountData(address);
    const health: bigint = data[2]; // scaled by 1e30 in your setup
    setHf(health);

    // Interest rate logic
    const irm = new ethers.Contract(CONTRACTS.InterestRateModel.address, InterestRateModelABI, provider);
    const borrowTokenAddr: string = await lendingPool.borrowToken();
    const erc20 = new ethers.Contract(borrowTokenAddr, ["function balanceOf(address) view returns (uint256)"], provider);
    const cash: bigint = await erc20.balanceOf(CONTRACTS.LendingPool.address);
    const totalBorrows: bigint = await lendingPool.totalBorrows();
    const ratePerSec: bigint = await irm.getBorrowRatePerSecond(cash, totalBorrows);

    const SEC_PER_YEAR = 365 * 24 * 60 * 60;
    const apr = (Number(ratePerSec) / 1e18) * SEC_PER_YEAR;
    const apy = Math.pow(1 + (Number(ratePerSec) / 1e18), SEC_PER_YEAR) - 1;

    setAprPercent(apr * 100);
    setApyPercent(apy * 100);
  };

  useEffect(() => {
    if (isConnected) {
      fetchData();
      const id = setInterval(fetchData, 15000);
      return () => clearInterval(id);
    }
  }, [pool, address, publicClient, isConnected]);

  const hfFloat = useMemo(() => (hf === 0n ? null : Number(ethers.formatUnits(hf, 30))), [hf]);

  const risk = useMemo(() => {
    if (hfFloat === null) return { label: "Unknown", color: "bg-slate-600" };
    if (hfFloat < 1.0) return { label: "Danger: Position can be liquidated", color: "bg-red-600/30" };
    if (hfFloat < 1.2) return { label: "Warning: Health factor low", color: "bg-amber-600/30" };
    return { label: "Safe: Position healthy", color: "bg-emerald-700/30" };
  }, [hfFloat]);

  if (!isConnected) {
    return (
      <div className="w-full px-4 mt-4">
        <div className="rounded-xl border border-slate-600 bg-slate-800 p-6 text-center text-white backdrop-blur-lg">
          <h3 className="text-lg font-semibold">Connect your wallet</h3>
          <p className="text-slate-300 text-sm mt-2">
            Please connect your wallet to view your health factor, APR, and APY.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 mt-4">
      <div className={`rounded-xl border ${risk.color} p-4 sm:p-6 text-white backdrop-blur-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-wide">Risk &amp; Health</h3>
            <p className="text-slate-200 text-xs sm:text-sm">Live health factor</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-300">APR</div>
            <div className="text-base font-semibold">{aprPercent.toFixed(2)}%</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300 mt-1">APY</div>
            <div className="text-base font-semibold">{apyPercent.toFixed(2)}%</div>
          </div>
        </div>

        <div className="mt-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20">
          <div className="text-[11px] uppercase tracking-wide text-slate-300">Health factor</div>
          <div className="text-base sm:text-xl font-semibold">
            {hfFloat === null ? "—" : hfFloat.toFixed(5)}
          </div>
        </div>

        <div className="mt-3 rounded-lg px-3 py-2 border text-sm">
          {risk.label}
        </div>
      </div>
    </div>
  );
}
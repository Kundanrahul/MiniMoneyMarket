"use client";

import Navbar from "../components/Navbar";
import DepositForm from "../components/DepositForm";
import BorrowForm from "../components/BorrowForm";
import RepayForm from "../components/RepayForm";
import WithdrawForm from "../components/WithdrawForm";
import RiskHealthCard from "../components/RiskLiquidationDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-r from-slate-600 via-slate-800 to-slate-900 pt-50 px-4">
      <Navbar />
      <div className="mb-6">
        <RiskHealthCard />
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <div className="w-full max-w-sm">
          <DepositForm />
        </div>
        <div className="w-full max-w-sm">
          <WithdrawForm />
        </div>
        <div className="w-full max-w-sm">
          <BorrowForm />
        </div>
        <div className="w-full max-w-sm">
          <RepayForm />
        </div>
      </div>

      <footer className="flex flex-col items-center justify-center h-24 text-xs text-slate-300 border-t border-slate-700 mt-4 space-y-1">
        <p>This is a Decentralized finance dashboard.</p>
        <p>© {new Date().getFullYear()} Tested/Scripted with Foundry and Slither</p>
      </footer>
    </div>
  );
}

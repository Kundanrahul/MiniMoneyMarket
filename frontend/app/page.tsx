"use client";

import Navbar from "./components/Navbar";
import DepositForm from "./components/DepositForm";
import BorrowForm from "./components/BorrowForm";
import RepayForm from "./components/RepayForm";
import WithdrawForm from "./components/WithdrawForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-r from-slate-600 via-slate-800 to-slate-900 pt-50 px-4">
      <Navbar />
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
    </div>
  );
}

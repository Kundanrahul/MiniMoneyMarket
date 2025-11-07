"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import UserDashboard from "./UserDashboard";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-4 bg-transparent backdrop-blur-md border-b border-white/20 fixed top-0 left-0 z-50 h-28">
      {/* left*/}
    <div className="flex items-center scale-70 origin-top-left h-full mt-8">
  <UserDashboard />
</div>
      {/*hidden on small devices */}
      <div className="hidden md:flex mx-auto h-full items-center">
        <div className="relative">
          <span className="bg-white/10 backdrop-blur-sm px-4 py-1 rounded-lg text-white text-xl font-bold tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.8)] hover:text-emerald-400">
            MINIMONEYMARKET
          </span>
          <span className="absolute inset-0 blur-xl opacity-20 hover:opacity-40 transition-opacity duration-300 bg-linear-to-r from-green-400 to-emerald-500 rounded-lg"></span>
        </div>
      </div>

    {/* right */}

      <div className="flex items-center h-full scale-75 sm:scale-90">
        <ConnectButton showBalance={true} />
      </div>
    </nav>
  );
}



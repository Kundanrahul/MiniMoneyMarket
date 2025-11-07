import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "./context/WalletProvider";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mini Lending dApp",
  description: "Decentralized lending platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.className}`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}


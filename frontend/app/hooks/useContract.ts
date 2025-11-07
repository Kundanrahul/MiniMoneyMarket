"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers, Contract } from "ethers";
import { CONTRACTS } from "../lib/contracts";

type Nullable<T> = T | null;

/** Provider & signer hook */
export function useProviderAndSigner() {
  const [provider, setProvider] = useState<Nullable<ethers.BrowserProvider>>(null);
  const [signer, setSigner] = useState<Nullable<ethers.Signer>>(null);
  const [account, setAccount] = useState<Nullable<string>>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const anyWindow: any = window;
    if (!anyWindow.ethereum) return;

    const p = new ethers.BrowserProvider(anyWindow.ethereum as any);
    setProvider(p);

    (async () => {
      try {
        const accounts: string[] = await p.send("eth_requestAccounts", []);
        if (accounts.length) setAccount(accounts[0]);
        setSigner(await p.getSigner());
      } catch {
        console.warn("Wallet not connected yet.");
      }
    })();

    anyWindow.ethereum.on?.("accountsChanged", async (accounts: string[]) => {
      setAccount(accounts?.[0] ?? null);
      setSigner(await p.getSigner());
    });
  }, []);

  return { provider, signer, account };
}
/** Generic contract loader hook */
export function useContract(address: string, abi: any, signerOrProvider?: any) {
  const { provider, signer } = useProviderAndSigner();

  return useMemo(() => {
    if (!address || !abi) return null;
    const sOrP = signerOrProvider || signer || provider;
    if (!sOrP) return null;
    try {
      return new ethers.Contract(address, abi, sOrP);
    } catch (e) {
      console.error("useContract error:", e);
      return null;
    }
  }, [address, abi, provider, signer, signerOrProvider]) as Nullable<Contract>;
}

/** LendingPool contract hook */
export function useLendingPool() {
  const { address, abi } = CONTRACTS.LendingPool;
  return useContract(address, abi);
}

/** CollateralToken contract hook*/
export function useCollateralToken() {
  const { address, abi } = CONTRACTS.CollateralToken;
  return useContract(address, abi);
}

/** Generic ERC20 token by address */
export function useTokenByAddress(tokenAddress?: string) {
  if (!tokenAddress) return null;
  return useContract(tokenAddress, CONTRACTS.MockERC20.abi);
}

/** Mock DAI & USDC hooks */
export function useMockDAI() {
  const { address, abi } = CONTRACTS.MockDAI;
  return useContract(address, abi);
}

export function useMockUSDC() {
  const { address, abi } = CONTRACTS.MockUSDC;
  return useContract(address, abi);
}

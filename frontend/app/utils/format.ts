import { ethers } from "ethers";

export function parseAmount(amount: string, decimals = 18) {
  // Only supports decimal-like string amounts
  if (!amount || Number(amount) === 0) return 0n;
  //for 18 decimals
  return ethers.parseUnits(amount, decimals);
}

export function formatAmount(value: bigint, decimals = 18) {
  return ethers.formatUnits(value, decimals);
}

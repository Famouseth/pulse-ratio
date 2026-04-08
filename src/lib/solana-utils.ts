import { Connection, PublicKey } from "@solana/web3.js";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export const solanaConnection = new Connection(SOLANA_RPC, "confirmed");

export async function getSolWalletBalance(address?: string) {
  if (!address) return 0;
  try {
    const publicKey = new PublicKey(address);
    const lamports = await solanaConnection.getBalance(publicKey);
    return lamports / 1_000_000_000;
  } catch {
    return 0;
  }
}

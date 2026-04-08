"use client";

import { useState, useCallback } from "react";
import type { WalletSnapshot, WalletToken } from "@/types";

// ── Address detection ────────────────────────────────────────────────────────

export function isEvmAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function isSolanaAddress(addr: string) {
  // Base58, 32-44 chars, must NOT start with 0x
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

export function detectChain(address: string): "evm" | "solana" | null {
  const t = address.trim();
  if (isEvmAddress(t)) return "evm";
  if (isSolanaAddress(t)) return "solana";
  return null;
}

// ── EVM lookup via Ethplorer (free key) ─────────────────────────────────────

async function fetchEvmWallet(address: string): Promise<WalletSnapshot> {
  const res = await fetch(
    `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey&showTxCount=true`
  );
  if (!res.ok) throw new Error("Ethplorer API error");
  const data = await res.json();

  const ethBalance: number = data.ETH?.balance ?? 0;
  const ethPrice: number = data.ETH?.price?.rate ?? 0;

  const tokens: WalletToken[] = ((data.tokens ?? []) as Record<string, any>[])
    .map((t) => {
      const info = t.tokenInfo ?? {};
      const decimals = Number(info.decimals) || 18;
      const raw = Number(t.balance) / Math.pow(10, decimals);
      const price = Number(info.price?.rate ?? 0);
      return {
        symbol: info.symbol ?? "???",
        name: info.name ?? "Unknown Token",
        balance: raw,
        usdValue: raw * price,
        logo: info.image ? `https://ethplorer.io${info.image}` : null
      };
    })
    .filter((t) => t.balance > 0);

  return {
    nativeBalance: ethBalance,
    nativeSymbol: "ETH",
    nativeUsd: ethBalance * ethPrice,
    tokens,
    txCount: data.countTxs ?? 0,
    fetchedAt: Date.now()
  };
}

// ── Solana lookup via public RPC + Jupiter token list ─────────────────────────

const SOL_RPC = "https://api.mainnet-beta.solana.com";

async function solRpc(method: string, params: unknown[]) {
  const res = await fetch(SOL_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  if (!res.ok) throw new Error(`Solana RPC ${method} error`);
  return res.json();
}

// Jupiter strict token list mapped by mint
let _tokenMap: Record<string, { symbol: string; name: string; logoURI: string }> | null = null;
async function getTokenMap() {
  if (_tokenMap) return _tokenMap;
  try {
    const res = await fetch(
      "https://token.jup.ag/strict"
    );
    if (!res.ok) return {};
    const list: Array<{ address: string; symbol: string; name: string; logoURI: string }> = await res.json();
    _tokenMap = {};
    for (const t of list) _tokenMap[t.address] = t;
  } catch {
    _tokenMap = {};
  }
  return _tokenMap;
}

async function fetchSolanaWallet(address: string): Promise<WalletSnapshot> {
  const [balData, tokenMap] = await Promise.all([
    solRpc("getBalance", [address]),
    getTokenMap()
  ]);

  const solBalance = (balData.result?.value ?? 0) / 1e9;

  // SOL price from CoinGecko
  let solPrice = 0;
  try {
    const p = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const pd = await p.json();
    solPrice = pd?.solana?.usd ?? 0;
  } catch { /* graceful */ }

  // Token accounts
  let tokens: WalletToken[] = [];
  try {
    const tokData = await solRpc("getTokenAccountsByOwner", [
      address,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" }
    ]);
    tokens = ((tokData.result?.value ?? []) as Record<string, any>[])
      .map((acc) => {
        const info = acc.account?.data?.parsed?.info ?? {};
        const amount = info.tokenAmount ?? {};
        const mint: string = info.mint ?? "";
        const meta = tokenMap[mint] ?? null;
        return {
          symbol: meta?.symbol ?? mint.slice(0, 6) + "…",
          name: meta?.name ?? "SPL Token",
          balance: amount.uiAmount ?? 0,
          usdValue: 0,
          logo: meta?.logoURI ?? null,
          mint
        };
      })
      .filter((t) => t.balance > 0);
  } catch { /* return empty tokens gracefully */ }

  return {
    nativeBalance: solBalance,
    nativeSymbol: "SOL",
    nativeUsd: solBalance * solPrice,
    tokens,
    txCount: 0,
    fetchedAt: Date.now()
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface LookupResult {
  address: string;
  chain: "evm" | "solana";
  snapshot: WalletSnapshot;
}

export function useWalletLookup() {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (address: string): Promise<LookupResult | null> => {
    const trimmed = address.trim();
    const chain = detectChain(trimmed);
    if (!chain) {
      setError("Invalid address — paste a 0x… EVM address or a Solana base58 address.");
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const snapshot = chain === "evm"
        ? await fetchEvmWallet(trimmed)
        : await fetchSolanaWallet(trimmed);
      const r: LookupResult = { address: trimmed, chain, snapshot };
      setResult(r);
      return r;
    } catch (err) {
      setError("Could not load wallet data. Check the address and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, lookup, reset };
}

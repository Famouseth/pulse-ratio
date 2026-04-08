"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChainTVL, fetchYieldOpportunities, inferAsset } from "@/lib/defillama-api";
import { useAppStore } from "@/store/use-app-store";
import type { ChainTvlItem, TvlTotals } from "@/types";

const NON_EVM_CHAINS = new Set([
  "Solana", "Bitcoin", "Cardano", "Sui", "Aptos", "Near", "Tezos",
  "Cosmos", "Osmosis", "Injective", "Kujira", "Neutron", "Sei"
]);

export function useTvlData() {
  const chainScope = useAppStore((s) => s.chainScope);

  // Chain TVL: /v2/chains gives real per-chain TVL numbers
  const chainQuery = useQuery({
    queryKey: ["tvl", "chains"],
    queryFn: fetchChainTVL,
    refetchInterval: 60_000,
    staleTime: 50_000
  });

  // Yields: pool symbols ARE the underlying assets — this is the correct BTC/ETH filter
  // Shares the cache with use-opportunities.ts (same queryKey)
  const yieldsQuery = useQuery({
    queryKey: ["opportunities", "all"],
    queryFn: fetchYieldOpportunities,
    refetchInterval: 60_000,
    staleTime: 50_000
  });

  const chains: ChainTvlItem[] = useMemo(() => {
    const all = chainQuery.data ?? [];
    if (chainScope === "evm") return all.filter((c) => !NON_EVM_CHAINS.has(c.name));
    if (chainScope === "solana") return all.filter((c) => c.name === "Solana");
    return all;
  }, [chainQuery.data, chainScope]);

  const totals: TvlTotals | null = useMemo(() => {
    const pools = yieldsQuery.data ?? [];
    const allChains = chainQuery.data ?? [];
    if (!pools.length && !allChains.length) return null;

    // Filter pools by chain scope
    const scopedPools = chainScope === "solana"
      ? pools.filter((p) => p.chain.toLowerCase() === "solana")
      : chainScope === "evm"
      ? pools.filter((p) => !p.chain.toLowerCase().includes("sol"))
      : pools;

    let btcLending = 0, btcLp = 0, ethLending = 0, ethLp = 0;
    for (const pool of scopedPools) {
      const asset = inferAsset(pool.symbol);
      const tvl = pool.tvlUsd;
      if (asset === "BTC") {
        if (pool.type === "Lending") btcLending += tvl;
        else btcLp += tvl;
      } else if (asset === "ETH") {
        if (pool.type === "Lending") ethLending += tvl;
        else ethLp += tvl;
      }
    }

    const ethChain = allChains.find((c) => c.name === "Ethereum");
    const totalDeFiTvl = allChains.reduce((s, c) => s + c.tvl, 0);

    return {
      btcLending,
      btcLp,
      ethLending,
      ethLp,
      btcTotal: btcLending + btcLp,
      ethTotal: ethLending + ethLp,
      combined: btcLending + btcLp + ethLending + ethLp,
      ethChainTvl: ethChain?.tvl ?? 0,
      totalDeFiTvl
    };
  }, [yieldsQuery.data, chainQuery.data, chainScope]);

  const benchmark = useMemo(() => {
    if (!totals) return [];
    return [
      { asset: "BTC", tvl: totals.btcTotal },
      { asset: "ETH", tvl: totals.ethTotal }
    ];
  }, [totals]);

  return {
    chains,
    data: [] as never[],   // kept for backward compat — use chains[] instead
    totals,
    benchmark,
    isLoading: chainQuery.isLoading,
    isFetching: chainQuery.isFetching || yieldsQuery.isFetching
  };
}

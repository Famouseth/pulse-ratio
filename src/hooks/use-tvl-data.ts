"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { inferAsset } from "@/lib/defillama-api";
import { useAppStore } from "@/store/use-app-store";
import type { ChainTvlItem, TvlTotals } from "@/types";

const NON_EVM_CHAINS = new Set([
  "Solana", "Bitcoin", "Cardano", "Sui", "Aptos", "Near", "Tezos",
  "Cosmos", "Osmosis", "Injective", "Kujira", "Neutron", "Sei"
]);

// Fetch via server-side API proxy (no client-side DefiLlama calls)
async function fetchChainTVL(): Promise<ChainTvlItem[]> {
  const res = await fetch("/api/chains");
  if (!res.ok) throw new Error("chains API error");
  return res.json();
}

interface YieldsResponse {
  opportunities: import("@/types").Opportunity[];
  aaveBtcTvl: number;
  aaveEthTvl: number;
}

async function fetchYields(): Promise<YieldsResponse> {
  const res = await fetch("/api/yields");
  if (!res.ok) throw new Error("yields API error");
  return res.json();
}

export function useTvlData() {
  const chainScope = useAppStore((s) => s.chainScope);

  // Chain TVL: hourly refresh — top-level chain TVL barely moves
  const chainQuery = useQuery({
    queryKey: ["tvl", "chains"],
    queryFn: fetchChainTVL,
    refetchInterval: 60 * 60 * 1000,  // 1 hour
    staleTime: 55 * 60 * 1000,
    retry: 2
  });

  // Yield pools: 15 min — pool APYs and TVL can shift throughout the day
  const yieldsQuery = useQuery({
    queryKey: ["opportunities", "all"],
    queryFn: fetchYields,
    refetchInterval: 15 * 60 * 1000,  // 15 min
    staleTime: 14 * 60 * 1000,
    retry: 1
  });

  const chains: ChainTvlItem[] = useMemo(() => {
    const all = chainQuery.data ?? [];
    if (chainScope === "evm") return all.filter((c) => !NON_EVM_CHAINS.has(c.name));
    if (chainScope === "solana") return all.filter((c) => c.name === "Solana");
    if (chainScope === "pulse") return all.filter((c) => c.name === "Pulse");
    return all;
  }, [chainQuery.data, chainScope]);

  const totals: TvlTotals | null = useMemo(() => {
    const yieldsData = yieldsQuery.data;
    const allChains = chainQuery.data ?? [];
    // Need at least chain data to show anything meaningful
    if (chainQuery.isLoading && !allChains.length) return null;

    const pools = yieldsData?.opportunities ?? [];
    const aaveBtcTvl = yieldsData?.aaveBtcTvl ?? 0;
    const aaveEthTvl = yieldsData?.aaveEthTvl ?? 0;

    // Filter pools by chain scope
    const scopedPools = chainScope === "solana"
      ? pools.filter((p) => p.chain.toLowerCase() === "solana")
      : chainScope === "pulse"
      ? pools.filter((p) => p.chain.toLowerCase() === "pulse")
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
      totalDeFiTvl,
      aaveBtcTvl,
      aaveEthTvl
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

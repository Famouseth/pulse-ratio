"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// All fetches go through our server-side API routes (no direct third-party calls from client)
async function fetchGlobalMarket() {
  const res = await fetch("/api/global-market");
  if (!res.ok) throw new Error("global market API error");
  return res.json();
}

async function fetchSparklines() {
  const res = await fetch("/api/sparklines");
  if (!res.ok) throw new Error("sparklines API error");
  return res.json();
}

async function fetchDeFiOverview() {
  const res = await fetch("/api/defi-overview");
  if (!res.ok) throw new Error("defi overview API error");
  return res.json();
}

export function useDefiOverview() {
  const globalQuery = useQuery({
    queryKey: ["market", "global"],
    queryFn: fetchGlobalMarket,
    refetchInterval: 5 * 60 * 1000,   // 5 min — dominance/total mcap changes slowly
    staleTime: 4 * 60 * 1000,
    retry: 2
  });

  const sparklinesQuery = useQuery({
    queryKey: ["market", "sparklines"],
    queryFn: fetchSparklines,
    refetchInterval: 15 * 60 * 1000,  // 15 min — 7-day chart barely changes
    staleTime: 14 * 60 * 1000,
    retry: 1
  });

  const defiQuery = useQuery({
    queryKey: ["defi", "overview"],
    queryFn: fetchDeFiOverview,
    refetchInterval: 15 * 60 * 1000,  // 15 min — fees/DEX volume hour-level precision
    staleTime: 14 * 60 * 1000,
    retry: 2
  });

  // Normalize both sparklines to 100 at day 0 for relative comparison
  const normalizedSparklines = useMemo(() => {
    const s = sparklinesQuery.data;
    if (!s || s.btcPrices.length < 2) return null;

    const btc0 = s.btcPrices[0];
    const eth0 = s.ethPrices[0];

    return s.timestamps.map((ts: number, i: number) => ({
      date: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      btc: parseFloat(((s.btcPrices[i] / btc0) * 100).toFixed(2)),
      eth: parseFloat(((s.ethPrices[i] / eth0) * 100).toFixed(2)),
      btcPrice: s.btcPrices[i],
      ethPrice: s.ethPrices[i]
    }));
  }, [sparklinesQuery.data]);

  function refetchAll() {
    globalQuery.refetch();
    sparklinesQuery.refetch();
    defiQuery.refetch();
  }

  return {
    globalMarket: globalQuery.data ?? null,
    sparklines: sparklinesQuery.data ?? null,
    normalizedSparklines,
    defiOverview: defiQuery.data ?? null,
    isLoading: globalQuery.isLoading || sparklinesQuery.isLoading || defiQuery.isLoading,
    isFetching: globalQuery.isFetching || sparklinesQuery.isFetching || defiQuery.isFetching,
    isError: globalQuery.isError,
    dataUpdatedAt: globalQuery.dataUpdatedAt || null,
    refetch: refetchAll
  };
}

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDeFiOverview } from "@/lib/defillama-api";
import { fetchGlobalMarket, fetchSparklines } from "@/lib/market-api";

export function useDefiOverview() {
  const globalQuery = useQuery({
    queryKey: ["market", "global"],
    queryFn: fetchGlobalMarket,
    refetchInterval: 90_000,
    staleTime: 80_000,
    retry: 2
  });

  const sparklinesQuery = useQuery({
    queryKey: ["market", "sparklines"],
    queryFn: fetchSparklines,
    refetchInterval: 300_000,   // 5 min — 7d chart doesn't need frequent refresh
    staleTime: 280_000,
    retry: 1
  });

  const defiQuery = useQuery({
    queryKey: ["defi", "overview"],
    queryFn: fetchDeFiOverview,
    refetchInterval: 120_000,
    staleTime: 100_000,
    retry: 2
  });

  // Normalize both sparklines to 100 at day 0 for relative comparison
  const normalizedSparklines = useMemo(() => {
    const s = sparklinesQuery.data;
    if (!s || s.btcPrices.length < 2) return null;

    const btc0 = s.btcPrices[0];
    const eth0 = s.ethPrices[0];

    return s.timestamps.map((ts, i) => ({
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

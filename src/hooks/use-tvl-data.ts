"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProtocolTVLUniverse } from "@/lib/defillama-api";
import { aggregateTvl, getBenchmarkTvl } from "@/lib/tvl-utils";
import { useAppStore } from "@/store/use-app-store";

export function useTvlData() {
  const chainScope = useAppStore((s) => s.chainScope);

  const query = useQuery({
    queryKey: ["tvl", "protocol-universe"],
    queryFn: fetchProtocolTVLUniverse,
    refetchInterval: 45_000
  });

  const filteredData = useMemo(() => {
    const points = query.data ?? [];
    if (chainScope === "all") return points;
    if (chainScope === "evm") return points.filter((item) => item.chain.toLowerCase() !== "solana");
    return points.filter((item) => item.chain.toLowerCase() === "solana");
  }, [chainScope, query.data]);

  const totals = useMemo(() => (filteredData.length ? aggregateTvl(filteredData) : null), [filteredData]);
  const benchmark = useMemo(() => (filteredData.length ? getBenchmarkTvl(filteredData) : []), [filteredData]);

  return {
    ...query,
    data: filteredData,
    totals,
    benchmark
  };
}

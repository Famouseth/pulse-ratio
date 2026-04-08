"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchYieldOpportunities } from "@/lib/defillama-api";
import { useAppStore } from "@/store/use-app-store";

export function useOpportunities() {
  const chainScope = useAppStore((s) => s.chainScope);

  const query = useQuery({
    queryKey: ["opportunities", "all"],
    queryFn: fetchYieldOpportunities,
    refetchInterval: 60_000
  });

  const filteredData = useMemo(() => {
    const data = query.data ?? [];
    if (chainScope === "all") return data;
    if (chainScope === "solana") return data.filter((item) => item.chain.toLowerCase().includes("sol"));
    return data.filter((item) => !item.chain.toLowerCase().includes("sol"));
  }, [chainScope, query.data]);

  const topYields = useMemo(
    () => [...filteredData].sort((a, b) => b.apy - a.apy).slice(0, 10),
    [filteredData]
  );

  return {
    ...query,
    data: filteredData,
    topYields
  };
}

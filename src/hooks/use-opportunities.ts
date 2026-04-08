"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/use-app-store";
import type { Opportunity } from "@/types";

async function fetchYields(): Promise<{ opportunities: Opportunity[] }> {
  const res = await fetch("/api/yields");
  if (!res.ok) throw new Error("yields API error");
  return res.json();
}

export function useOpportunities() {
  const chainScope = useAppStore((s) => s.chainScope);

  const query = useQuery({
    queryKey: ["opportunities", "all"],
    queryFn: fetchYields,
    refetchInterval: 15 * 60 * 1000,  // 15 min
    staleTime: 14 * 60 * 1000,
    retry: 1
  });

  const filteredData = useMemo(() => {
    const data = query.data?.opportunities ?? [];
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

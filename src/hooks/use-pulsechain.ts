"use client";

import { useQuery } from "@tanstack/react-query";

export interface PulseChainData {
  plsTvl: number;
  plsChange1d: number;
  plsChange7d: number;
  plsPrice: number;
  latestBlock: number | null;
  bridgeName: string;
  bridge24hVolume: number | null;
  bridgeContracts: {
    ethOmniBridge: string;
    ethAmb: string;
    plsOmniBridge: string;
    plsAmb: string;
  };
  bridgeUrl: string;
  explorerUrl: string;
  pulsexUrl: string;
  docsUrl: string;
  rpcs: string[];
}

export function usePulsechain() {
  return useQuery<PulseChainData>({
    queryKey: ["pulsechain"],
    queryFn: async () => {
      const res = await fetch("/api/pulsechain");
      if (!res.ok) throw new Error("pulsechain API error");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}

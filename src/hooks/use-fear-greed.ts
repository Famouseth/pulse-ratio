"use client";

import { useQuery } from "@tanstack/react-query";

export interface FearGreedData {
  value: number;           // 0-100
  classification: string;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: Date;
}

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch("https://api.alternative.me/fng/?limit=1", {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error("Fear & Greed API unavailable");
  const json = await res.json();
  const entry = json.data[0];
  return {
    value: Number(entry.value),
    classification: entry.value_classification ?? "Unknown",
    timestamp: new Date(Number(entry.timestamp) * 1000)
  };
}

export function useFearGreed() {
  return useQuery({
    queryKey: ["market", "feargreed"],
    queryFn: fetchFearGreed,
    refetchInterval: 60 * 60 * 1000, // hourly — index only updates once/day
    staleTime: 55 * 60 * 1000,
    retry: 1
  });
}

/** Returns a color based on the Fear & Greed value */
export function fngColor(value: number): string {
  if (value <= 25) return "#EF4444"; // extreme fear = red
  if (value <= 45) return "#F97316"; // fear = orange
  if (value <= 55) return "#EAB308"; // neutral = yellow
  if (value <= 75) return "#22C55E"; // greed = green
  return "#06D6A0";                  // extreme greed = cyan
}

/** Plain interpretation string */
export function fngSignal(value: number): string {
  if (value <= 25) return "Extreme fear — historically strong buy zone for BTC";
  if (value <= 45) return "Fear — cautious accumulation; watch support levels";
  if (value <= 55) return "Neutral — no clear directional edge";
  if (value <= 75) return "Greed — momentum strong; tighten stops";
  return "Extreme greed — historically high-risk entry; consider reducing";
}

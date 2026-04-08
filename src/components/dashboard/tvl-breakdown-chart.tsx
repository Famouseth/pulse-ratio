"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChainTvlItem } from "@/types";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum:  "#5B7FFF",
  Bitcoin:   "#F7931A",
  Solana:    "#9B5BFF",
  Tron:      "#EF4444",
  BSC:       "#EAB308",
  Arbitrum:  "#06D6A0",
  Base:      "#22C55E",
  Polygon:   "#8B5CF6",
  Avalanche: "#FF6B35",
  Aptos:     "#00C4FF",
  Sui:       "#4FC3F7",
  Optimism:  "#FF0420",
};

function fmt(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

interface Props {
  chains: ChainTvlItem[];
  totalTvl: number;
  btcPoolTvl?: number;
  ethPoolTvl?: number;
  isLoading?: boolean;
}

export function TvlBreakdownChart({
  chains,
  totalTvl,
  btcPoolTvl = 0,
  ethPoolTvl = 0,
  isLoading = false
}: Props) {
  if (isLoading || !chains.length) {
    return (
      <div className="space-y-3">
        <div className="h-52 w-full animate-pulse rounded-xl bg-white/5" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  const top5 = chains.slice(0, 5);
  const otherTvl = totalTvl - top5.reduce((s, c) => s + c.tvl, 0);
  const pieData = [
    ...top5.map((c) => ({
      name: c.name,
      value: c.tvl,
      color: CHAIN_COLORS[c.name] ?? "#4a4a6a"
    })),
    ...(otherTvl > 0 ? [{ name: "Other", value: otherTvl, color: "#2a2a4a" }] : [])
  ];

  const btcChain = chains.find((c) => c.name === "Bitcoin");
  const ethChain = chains.find((c) => c.name === "Ethereum");
  // Use pool TVL if loaded, otherwise fall back to chain TVL
  const btcVal = btcPoolTvl > 0 ? btcPoolTvl : (btcChain?.tvl ?? 0);
  const ethVal = ethPoolTvl > 0 ? ethPoolTvl : (ethChain?.tvl ?? 0);
  const total = btcVal + ethVal;
  const btcPct = total > 0 ? (btcVal / total) * 100 : 50;
  const ethPct = total > 0 ? 100 - btcPct : 50;

  return (
    <div className="space-y-3">
      {/* Donut - top chains */}
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(10,12,24,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 12
              }}
              formatter={(v: number, name: string) => [fmt(v), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] text-muted-foreground">Total DeFi TVL</p>
          <p className="text-base font-bold text-foreground">{fmt(totalTvl)}</p>
        </div>
      </div>

      {/* Chain legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {top5.map((c) => (
          <div key={c.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CHAIN_COLORS[c.name] ?? "#4a4a6a" }}
            />
            {c.name}
          </div>
        ))}
      </div>

      {/* BTC vs ETH bar */}
      <div className="border-t border-white/5 pt-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          BTC vs ETH DeFi Exposure
          {btcPoolTvl === 0 && <span className="ml-1 text-[9px] opacity-60">(chain TVL)</span>}
        </p>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-[#F7931A]/80 transition-all" style={{ width: `${btcPct}%` }} />
          <div className="h-full flex-1 bg-[#5B7FFF]/80" />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="font-mono text-[#F7931A]">{fmt(btcVal)} BTC ({btcPct.toFixed(0)}%)</span>
          <span className="font-mono text-[#5B7FFF]">{fmt(ethVal)} ETH ({ethPct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}

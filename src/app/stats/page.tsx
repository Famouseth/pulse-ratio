"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { formatUsd } from "@/lib/utils";

function DeltaIcon({ v }: { v: number }) {
  if (v > 0.5) return <TrendingUp className="inline h-3.5 w-3.5 text-emerald-400" />;
  if (v < -0.5) return <TrendingDown className="inline h-3.5 w-3.5 text-rose-400" />;
  return <Minus className="inline h-3.5 w-3.5 text-muted-foreground" />;
}

function SBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: color + "22", color }}>
      {label}
    </span>
  );
}

export default function StatsPage() {
  const { data: market } = useMarketData();
  const { totals, chains } = useTvlData();
  const { globalMarket, normalizedSparklines, defiOverview } = useDefiOverview();

  const btcMcap = market?.BTC.marketCap ?? 0;
  const ethMcap = market?.ETH.marketCap ?? 0;
  const btcVol = market?.BTC.volume24h ?? 0;
  const ethVol = market?.ETH.volume24h ?? 0;
  const btcPrice = market?.BTC.price ?? 0;
  const ethPrice = market?.ETH.price ?? 0;
  const btcChange = market?.BTC.change24h ?? 0;
  const ethChange = market?.ETH.change24h ?? 0;

  // Volume/MCap ratio (capital efficiency)
  const btcVolMcap = btcMcap > 0 ? (btcVol / btcMcap) * 100 : 0;
  const ethVolMcap = ethMcap > 0 ? (ethVol / ethMcap) * 100 : 0;

  // MCap/TVL ratios (if TVL available)
  const btcMcapTvl = totals?.btcTotal && totals.btcTotal > 0 ? btcMcap / totals.btcTotal : 0;
  const ethMcapTvl = totals?.ethTotal && totals.ethTotal > 0 ? ethMcap / totals.ethTotal : 0;

  const rows = [
    { label: "Price", btc: formatUsd(btcPrice, 0), eth: formatUsd(ethPrice, 0), btcDelta: btcChange, ethDelta: ethChange, ratio: btcPrice > 0 && ethPrice > 0 ? (btcPrice / ethPrice).toFixed(2) + "×" : "—" },
    { label: "Market Cap", btc: formatUsd(btcMcap, 1), eth: formatUsd(ethMcap, 1), btcDelta: 0, ethDelta: 0, ratio: btcMcap > 0 && ethMcap > 0 ? (btcMcap / ethMcap).toFixed(2) + "×" : "—" },
    { label: "24h Volume", btc: formatUsd(btcVol, 1), eth: formatUsd(ethVol, 1), btcDelta: 0, ethDelta: 0, ratio: btcVol > 0 && ethVol > 0 ? (btcVol / ethVol).toFixed(2) + "×" : "—" },
    { label: "Vol / MCap %", btc: `${btcVolMcap.toFixed(2)}%`, eth: `${ethVolMcap.toFixed(2)}%`, btcDelta: 0, ethDelta: 0, ratio: ethVolMcap > 0 ? (btcVolMcap / ethVolMcap).toFixed(2) + "×" : "—" },
    { label: "DeFi TVL", btc: formatUsd(totals?.btcTotal ?? 0, 1), eth: formatUsd(totals?.ethTotal ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: totals?.btcTotal && totals.ethTotal ? (totals.btcTotal / totals.ethTotal).toFixed(2) + "×" : "—" },
    { label: "DeFi Lending TVL", btc: formatUsd(totals?.btcLending ?? 0, 1), eth: formatUsd(totals?.ethLending ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: "—" },
    { label: "DeFi LP TVL", btc: formatUsd(totals?.btcLp ?? 0, 1), eth: formatUsd(totals?.ethLp ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: "—" },
    { label: "MCap / TVL", btc: btcMcapTvl > 0 ? `${btcMcapTvl.toFixed(1)}×` : "—", eth: ethMcapTvl > 0 ? `${ethMcapTvl.toFixed(1)}×` : "—", btcDelta: 0, ethDelta: 0, ratio: "—" },
    { label: "Dominance", btc: `${(globalMarket?.btcDominance ?? 0).toFixed(1)}%`, eth: `${(globalMarket?.ethDominance ?? 0).toFixed(1)}%`, btcDelta: 0, ethDelta: 0, ratio: globalMarket ? (globalMarket.btcDominance / globalMarket.ethDominance).toFixed(2) + "×" : "—" },
    { label: "24h Price Change", btc: `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}%`, eth: `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`, btcDelta: btcChange, ethDelta: ethChange, ratio: "—" }
  ];

  // Dominance bar data
  const dominanceData = useMemo(() => {
    const btcD = globalMarket?.btcDominance ?? 0;
    const ethD = globalMarket?.ethDominance ?? 0;
    const other = 100 - btcD - ethD;
    return [
      { name: "BTC", value: btcD, fill: "#F7931A" },
      { name: "ETH", value: ethD, fill: "#5B7FFF" },
      { name: "Other", value: other, fill: "#4a4a6a" }
    ];
  }, [globalMarket]);

  // Chain TVL bar chart (top 10)
  const chainBarData = chains.slice(0, 10).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    tvl: c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF" : c.name === "Bitcoin" ? "#F7931A" : c.name === "Solana" ? "#9B5BFF" : "#06D6A0"
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">BTC vs ETH — Full Correlation Dashboard</h1>

      {/* Global market summary strip */}
      {globalMarket && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-black/30 px-5 py-3 text-sm">
          <span>Total Crypto MCap <strong className="ml-1 text-foreground">{formatUsd(globalMarket.totalMarketCap, 1)}</strong></span>
          <span>24h Volume <strong className="ml-1 text-foreground">{formatUsd(globalMarket.total24hVolume, 1)}</strong></span>
          <span>Active Coins <strong className="ml-1 text-foreground">{globalMarket.activeCryptos.toLocaleString()}</strong></span>
          <span>MCap Change <strong className={`ml-1 ${globalMarket.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{globalMarket.change24h >= 0 ? "+" : ""}{globalMarket.change24h.toFixed(2)}%</strong></span>
          {defiOverview && (
            <>
              <span>DEX Vol 24h <strong className="ml-1 text-foreground">{formatUsd(defiOverview.dexVolume24h, 1)}</strong></span>
              <span>Protocol Fees 24h <strong className="ml-1 text-foreground">{formatUsd(defiOverview.fees24h, 1)}</strong></span>
            </>
          )}
        </div>
      )}

      {/* Correlation scorecard table */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Correlation Scorecard</CardTitle>
            <div className="flex gap-3 text-xs">
              <SBadge label="● BTC" color="#F7931A" />
              <SBadge label="● ETH" color="#5B7FFF" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 text-left">Metric</th>
                <th className="px-6 py-3 text-right text-[#F7931A]">BTC</th>
                <th className="px-6 py-3 text-right text-[#5B7FFF]">ETH</th>
                <th className="px-6 py-3 text-right">BTC/ETH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.label} className="transition-colors hover:bg-white/3">
                  <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-[#F7931A]">
                    {row.btcDelta !== 0 && <DeltaIcon v={row.btcDelta} />} {row.btc}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-[#5B7FFF]">
                    {row.ethDelta !== 0 && <DeltaIcon v={row.ethDelta} />} {row.eth}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-muted-foreground">{row.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Normalized 7-day performance */}
      {normalizedSparklines && normalizedSparklines.length > 1 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle>7-Day Relative Performance (Indexed to 100)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={normalizedSparklines} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B7FFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5B7FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7595" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7595" }} domain={["auto", "auto"]} tickFormatter={(v) => `${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(2)}`, name === "btc" ? "BTC" : "ETH"]}
                />
                <Legend formatter={(v) => v === "btc" ? "BTC" : "ETH"} />
                <Area type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2} fill="url(#btcGrad)" />
                <Area type="monotone" dataKey="eth" stroke="#5B7FFF" strokeWidth={2} fill="url(#ethGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Market dominance */}
        {globalMarket && (
          <Card className="border-white/5 bg-black/20">
            <CardHeader>
              <CardTitle>Market Cap Dominance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dominanceData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7595" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7595" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {dominanceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Chain TVL */}
        {chainBarData.length > 0 && (
          <Card className="border-white/5 bg-black/20">
            <CardHeader>
              <CardTitle>Chain TVL — Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chainBarData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [formatUsd(v, 1)]}
                  />
                  <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
                    {chainBarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top DEXes table */}
      {defiOverview && defiOverview.topDexes.length > 0 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle>Top DEXes by 24h Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {defiOverview.topDexes.map((dex, i) => {
                const sharePct = defiOverview.dexVolume24h > 0 ? (dex.volume24h / defiOverview.dexVolume24h) * 100 : 0;
                return (
                  <div key={dex.name} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{dex.name}</span>
                    <div className="w-32 overflow-hidden rounded-full bg-white/5 h-1.5">
                      <div className="h-full rounded-full bg-cyber" style={{ width: `${sharePct}%` }} />
                    </div>
                    <span className="w-24 text-right font-mono text-sm text-foreground">{formatUsd(dex.volume24h, 1)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceRatioChart } from "@/components/charts/price-ratio-chart";
import { useAppStore } from "@/store/use-app-store";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { formatUsd } from "@/lib/utils";

const tabs = [
  "BTC/ETH Ratio (Live)",
  "7-Day Performance",
  "Volume Comparison",
  "Chain TVL"
] as const;

type Tab = (typeof tabs)[number];

export default function ChartsPage() {
  const [tab, setTab] = useState<Tab>("BTC/ETH Ratio (Live)");
  const ratio = useAppStore((s) => s.ratioHistory).map((e) => ({ time: e.timestamp, value: e.ratio }));
  const { data: market } = useMarketData();
  const { chains } = useTvlData();
  const { normalizedSparklines, defiOverview } = useDefiOverview();

  // Volume comparison bars: BTC vs ETH 24h volume
  const volumeData = [
    { name: "BTC 24h Vol", value: market?.BTC.volume24h ?? 0, fill: "#F7931A" },
    { name: "ETH 24h Vol", value: market?.ETH.volume24h ?? 0, fill: "#5B7FFF" }
  ];

  // MCap bars
  const mcapData = [
    { name: "BTC MCap", value: market?.BTC.marketCap ?? 0, fill: "#F7931A" },
    { name: "ETH MCap", value: market?.ETH.marketCap ?? 0, fill: "#5B7FFF" }
  ];

  // Top DEX bars
  const dexData = (defiOverview?.topDexes ?? []).map((d) => ({ name: d.name, volume: d.volume24h, fill: "#06D6A0" }));

  // Chain TVL
  const chainData = chains.slice(0, 15).map((c) => ({
    name: c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name,
    tvl: c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF" : c.name === "Bitcoin" ? "#F7931A" : c.name === "Solana" ? "#9B5BFF" : "#06D6A0"
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Charts — BTC vs ETH Analysis</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      {/* BTC/ETH Ratio — live TradingView chart */}
      {tab === "BTC/ETH Ratio (Live)" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BTC / ETH Price Ratio — Binance WebSocket (Tick)</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceRatioChart points={ratio} />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Current Ratio", val: market ? (market.BTC.price / market.ETH.price).toFixed(3) : "—" },
              { label: "BTC Price", val: market ? formatUsd(market.BTC.price, 0) : "—" },
              { label: "ETH Price", val: market ? formatUsd(market.ETH.price, 0) : "—" }
            ].map((c) => (
              <Card key={c.label} className="border-white/5 bg-black/20">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-semibold">{c.val}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day normalized performance */}
      {tab === "7-Day Performance" && (
        <div className="space-y-4">
          {normalizedSparklines && normalizedSparklines.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>BTC vs ETH — 7-Day Relative Performance (100 = start)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={normalizedSparklines} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="btcG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7931A" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ethG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B7FFF" stopOpacity={0.2} />
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
                    <Area type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2.5} fill="url(#btcG)" dot={{ fill: "#F7931A", r: 3 }} />
                    <Area type="monotone" dataKey="eth" stroke="#5B7FFF" strokeWidth={2.5} fill="url(#ethG)" dot={{ fill: "#5B7FFF", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">Loading 7-day sparkline data from CoinGecko…</CardContent>
            </Card>
          )}

          {/* Actual prices */}
          {normalizedSparklines && (
            <Card className="border-white/5 bg-black/20">
              <CardHeader><CardTitle>7-Day Price History</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="py-2 text-left">Date</th>
                      <th className="py-2 text-right text-[#F7931A]">BTC</th>
                      <th className="py-2 text-right text-[#5B7FFF]">ETH</th>
                      <th className="py-2 text-right">BTC/ETH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {normalizedSparklines.map((row) => (
                      <tr key={row.date}>
                        <td className="py-2 text-muted-foreground">{row.date}</td>
                        <td className="py-2 text-right font-mono text-[#F7931A]">{formatUsd(row.btcPrice, 0)}</td>
                        <td className="py-2 text-right font-mono text-[#5B7FFF]">{formatUsd(row.ethPrice, 0)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{row.ethPrice > 0 ? (row.btcPrice / row.ethPrice).toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Volume / MCap comparison */}
      {tab === "Volume Comparison" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>24h Trade Volume — BTC vs ETH</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volumeData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a8b3cf" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1)]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{volumeData.map((e) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Market Cap — BTC vs ETH</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mcapData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a8b3cf" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1)]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{mcapData.map((e) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {dexData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Top DEXes — 24h Volume</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dexData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                    <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1), "Volume"]} />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>{dexData.map((e) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chain TVL */}
      {tab === "Chain TVL" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Chain TVL — Top 15 (DefiLlama live)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chainData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} width={90} />
                  <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1), "TVL"]} />
                  <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>{chainData.map((e) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

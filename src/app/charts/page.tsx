"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradingViewWidget } from "@/components/charts/tradingview-widget";
import { RefreshBadge } from "@/components/ui/refresh-badge";
import { DataSources } from "@/components/ui/data-sources";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { formatUsd } from "@/lib/utils";

const SYMBOLS = [
  { label: "ETH/BTC Ratio", value: "BINANCE:ETHBTC" },
  { label: "BTC/USD", value: "BINANCE:BTCUSDT" },
  { label: "ETH/USD", value: "BINANCE:ETHUSDT" },
  { label: "Total Crypto MCap", value: "CRYPTOCAP:TOTAL" }
] as const;

const INTERVALS = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1H", value: "60" },
  { label: "4H", value: "240" },
  { label: "1D", value: "D" },
  { label: "1W", value: "W" }
] as const;

const TABS = ["TradingView Chart", "7-Day Performance", "Volume Comparison", "Chain TVL"] as const;
type Tab = (typeof TABS)[number];

export default function ChartsPage() {
  const [tab, setTab] = useState<Tab>("TradingView Chart");
  const [symbol, setSymbol] = useState<string>(SYMBOLS[0].value);
  const [interval, setInterval] = useState<string>("60");

  const { data: market, dataUpdatedAt: marketUpdated, isFetching: marketFetching, refetch: refetchMarket } = useMarketData();
  const { chains } = useTvlData();
  const { normalizedSparklines, defiOverview, dataUpdatedAt: defiUpdated, isFetching: defiFetching, refetch: refetchDefi } = useDefiOverview();

  const volumeData = [
    { name: "BTC 24h Vol", value: market?.BTC.volume24h ?? 0, fill: "#F7931A" },
    { name: "ETH 24h Vol", value: market?.ETH.volume24h ?? 0, fill: "#5B7FFF" }
  ];
  const mcapData = [
    { name: "BTC MCap", value: market?.BTC.marketCap ?? 0, fill: "#F7931A" },
    { name: "ETH MCap", value: market?.ETH.marketCap ?? 0, fill: "#5B7FFF" }
  ];
  const dexData = (defiOverview?.topDexes ?? []).map((d: { name: string; volume24h: number }) => ({
    name: d.name, volume: d.volume24h, fill: "#06D6A0"
  }));
  const chainData = chains.slice(0, 15).map((c: { name: string; tvl: number }) => ({
    name: c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name,
    tvl: c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF" : c.name === "Bitcoin" ? "#F7931A" : c.name === "Solana" ? "#9B5BFF" : "#06D6A0"
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Charts</h1>
          <DataSources sources={["tradingview", "coingecko", "defillama", "defillamaDex", "binance"]} />
        </div>
        <RefreshBadge
          lastUpdated={marketUpdated || defiUpdated}
          onRefresh={() => { refetchMarket(); refetchDefi(); }}
          intervalMs={10_000}
          isRefreshing={marketFetching || defiFetching}
        />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {/* ── TradingView Chart ─────────────────────────────────────── */}
      {tab === "TradingView Chart" && (
        <div className="space-y-3">
          {/* Symbol + interval selectors */}
          <Card className="border-white/5 bg-black/20">
            <CardContent className="flex flex-wrap items-center gap-3 py-3">
              <div className="flex flex-wrap gap-1.5">
                {SYMBOLS.map((s) => (
                  <Button
                    key={s.value}
                    variant={symbol === s.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSymbol(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <div className="ml-auto flex gap-1">
                {INTERVALS.map((iv) => (
                  <Button
                    key={iv.value}
                    variant={interval === iv.value ? "default" : "ghost"}
                    size="sm"
                    className="h-7 w-9 px-0 text-xs"
                    onClick={() => setInterval(iv.value)}
                  >
                    {iv.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full TradingView chart with RSI, MACD, Volume */}
          <Card className="overflow-hidden border-white/5">
            <div className="min-h-[780px] h-[calc(100vh-200px)] max-h-[1350px] w-full">
              <TradingViewWidget
                symbol={symbol}
                interval={interval}
                studies={["Volume@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]}
              />
            </div>
          </Card>

          {/* Live stat bar */}
          {market && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "BTC Price", val: formatUsd(market.BTC.price, 0), delta: market.BTC.change24h, color: "#F7931A" },
                { label: "ETH Price", val: formatUsd(market.ETH.price, 0), delta: market.ETH.change24h, color: "#5B7FFF" },
                { label: "BTC/ETH Ratio", val: `${(market.BTC.price / market.ETH.price).toFixed(3)}×`, delta: 0, color: "#06D6A0" }
              ].map((c) => (
                <Card key={c.label} className="border-white/5 bg-black/20">
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-semibold" style={{ color: c.color }}>{c.val}</p>
                    {c.delta !== 0 && (
                      <p className={`text-xs mt-1 ${c.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {c.delta >= 0 ? "+" : ""}{c.delta.toFixed(2)}% 24h
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 7-Day Performance ────────────────────────────────────── */}
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
                    <Area type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2.5} fill="url(#btcG)" />
                    <Area type="monotone" dataKey="eth" stroke="#5B7FFF" strokeWidth={2.5} fill="url(#ethG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-16 text-center text-muted-foreground">Loading 7-day data from CoinGecko…</CardContent></Card>
          )}
          {normalizedSparklines && (
            <Card className="border-white/5 bg-black/20">
              <CardHeader><CardTitle>Price Table</CardTitle></CardHeader>
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
                    {normalizedSparklines.map((row: { date: string; btc: number; eth: number; btcPrice: number; ethPrice: number }) => (
                      <tr key={row.date}>
                        <td className="py-2 text-muted-foreground">{row.date}</td>
                        <td className="py-2 text-right font-mono text-[#F7931A]">{formatUsd(row.btcPrice, 0)}</td>
                        <td className="py-2 text-right font-mono text-[#5B7FFF]">{formatUsd(row.ethPrice, 0)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">
                          {row.ethPrice > 0 ? (row.btcPrice / row.ethPrice).toFixed(2) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Volume Comparison ─────────────────────────────────────── */}
      {tab === "Volume Comparison" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>24h Trade Volume</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a8b3cf" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1)]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{volumeData.map((e: { name: string; value: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Market Cap</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mcapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a8b3cf" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1)]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{mcapData.map((e: { name: string; value: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {dexData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Top DEXes — 24h Volume</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dexData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                    <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1), "Volume"]} />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>{dexData.map((e: { name: string; volume: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Chain TVL ────────────────────────────────────────────── */}
      {tab === "Chain TVL" && (
        <Card>
          <CardHeader>
            <CardTitle>Chain TVL — Top 15 (DefiLlama)</CardTitle>
            <div className="flex gap-2 mt-1">
              {[
                { label: "ETH", color: "#5B7FFF" },
                { label: "BTC", color: "#F7931A" },
                { label: "SOL", color: "#9B5BFF" },
                { label: "Other", color: "#06D6A0" }
              ].map((l) => (
                <Badge key={l.label} variant="default" className="text-[10px] gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chainData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} width={90} />
                <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number) => [formatUsd(v, 1), "TVL"]} />
                <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>{chainData.map((e: { name: string; tvl: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



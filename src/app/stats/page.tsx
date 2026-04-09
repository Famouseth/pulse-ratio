"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshBadge } from "@/components/ui/refresh-badge";
import { DataSources } from "@/components/ui/data-sources";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { useFearGreed, fngColor, fngSignal } from "@/hooks/use-fear-greed";
import { usePulsechain } from "@/hooks/use-pulsechain";
import { formatUsd } from "@/lib/utils";

// ---- Helpers --------------------------------------------------------

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

function DeltaIcon({ v }: { v: number }) {
  if (v > 0.5) return <TrendingUp className="inline h-3.5 w-3.5 text-emerald-400" />;
  if (v < -0.5) return <TrendingDown className="inline h-3.5 w-3.5 text-rose-400" />;
  return <Minus className="inline h-3.5 w-3.5 text-muted-foreground" />;
}

function ColorBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}

/** Pearson correlation coefficient */
function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
}

/** Simple RSI from price array */
function simpleRsi(prices: number[]): number | null {
  if (prices.length < 2) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) gains += d; else losses += Math.abs(d);
  }
  const periods = prices.length - 1;
  const avgG = gains / periods;
  const avgL = losses / periods;
  if (avgL === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgG / avgL)).toFixed(1));
}

function rsiLabel(v: number | null): { text: string; color: string } {
  if (v === null) return { text: "N/A", color: "#6b7595" };
  if (v < 30)  return { text: `${v} - Oversold`,   color: "#22C55E" };
  if (v > 70)  return { text: `${v} - Overbought`,  color: "#EF4444" };
  return             { text: `${v} - Neutral`,      color: "#EAB308" };
}

function corrLabel(r: number): { text: string; color: string } {
  const a = Math.abs(r);
  if (a >= 0.9) return { text: "Very high (move in lock-step)", color: "#06D6A0" };
  if (a >= 0.7) return { text: "High correlation",              color: "#22C55E" };
  if (a >= 0.5) return { text: "Moderate correlation",          color: "#EAB308" };
  return              { text: "Low - assets diverging",          color: "#EF4444" };
}

// ---- Component -------------------------------------------------------

export default function StatsPage() {
  const {
    data: market,
    isFetching: marketFetching,
    dataUpdatedAt: marketUpdated,
    refetch: refetchMarket
  } = useMarketData();

  const { totals, chains, isFetching: tvlFetching } = useTvlData();

  const {
    globalMarket, normalizedSparklines, defiOverview, sparklines,
    isFetching: defiFetching, dataUpdatedAt: defiUpdated, refetch: refetchDefi
  } = useDefiOverview();

  const { data: fng } = useFearGreed();
  const { data: pulseData } = usePulsechain();

  const isLoading = !market && !globalMarket;

  // ---- Derived values ------------------------------------------------
  const btcMcap   = market?.BTC.marketCap  ?? 0;
  const ethMcap   = market?.ETH.marketCap  ?? 0;
  const btcVol    = market?.BTC.volume24h  ?? 0;
  const ethVol    = market?.ETH.volume24h  ?? 0;
  const btcPrice  = market?.BTC.price      ?? 0;
  const ethPrice  = market?.ETH.price      ?? 0;
  const btcChange = market?.BTC.change24h  ?? 0;
  const ethChange = market?.ETH.change24h  ?? 0;

  const btcVolMcap  = btcMcap > 0 ? (btcVol  / btcMcap)  * 100 : 0;
  const ethVolMcap  = ethMcap > 0 ? (ethVol  / ethMcap)  * 100 : 0;
  const btcMcapTvl = totals?.btcTotal && totals.btcTotal > 0 ? btcMcap / totals.btcTotal : 0;
  const ethMcapTvl = totals?.ethTotal && totals.ethTotal > 0 ? ethMcap / totals.ethTotal : 0;

  const analytics = useMemo(() => {
    const s = sparklines;
    if (!s || s.btcPrices.length < 3) return null;
    const r       = pearson(s.btcPrices, s.ethPrices);
    const btcRsi  = simpleRsi(s.btcPrices);
    const ethRsi  = simpleRsi(s.ethPrices);
    const n       = s.btcPrices.length;
    const btc7d   = n >= 2 ? ((s.btcPrices[n - 1] - s.btcPrices[0]) / s.btcPrices[0]) * 100 : 0;
    const m       = s.ethPrices.length;
    const eth7d   = m >= 2 ? ((s.ethPrices[m - 1] - s.ethPrices[0]) / s.ethPrices[0]) * 100 : 0;
    return { r, btcRsi, ethRsi, btc7d, eth7d, spread: btc7d - eth7d };
  }, [sparklines]);

  const winner = analytics
    ? analytics.spread > 0.5 ? "BTC" : analytics.spread < -0.5 ? "ETH" : "TIED"
    : null;

  const signal = useMemo(() => {
    if (!analytics || !fng) return null;
    const bRsi = analytics.btcRsi ?? 50;
    const eRsi = analytics.ethRsi ?? 50;
    const oversold   = bRsi < 40 || eRsi < 40;
    const overbought = bRsi > 65 || eRsi > 65;
    const fear  = fng.value <= 25;
    const greed = fng.value >= 65;
    if (fear  && oversold)   return { label: "Strong Buy Signal",           icon: "bullish", color: "#22C55E" };
    if (greed && overbought) return { label: "Caution - Overbought + Greed",icon: "bearish", color: "#EF4444" };
    if (oversold)            return { label: "Oversold - Watch for reversal",icon: "neutral", color: "#EAB308" };
    if (greed)               return { label: "Greed - Reduce risk exposure", icon: "bearish", color: "#F97316" };
    return                          { label: "Neutral - No strong signal",   icon: "neutral", color: "#6b7595" };
  }, [analytics, fng]);

  // ---- Scorecard data -----------------------------------------------
  const na  = "---";
  const rx  = (a: number, b: number) => b > 0 ? `${(a / b).toFixed(2)}x` : na;
  const pct = (v: number, d = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;

  const rows = [
    {
      label:    "Price",
      btc:      formatUsd(btcPrice, 0),
      eth:      formatUsd(ethPrice, 0),
      btcDelta: btcChange,
      ethDelta: ethChange,
      ratio:    rx(btcPrice, ethPrice)
    },
    {
      label:    "Market Cap",
      btc:      formatUsd(btcMcap, 1),
      eth:      formatUsd(ethMcap, 1),
      btcDelta: 0,
      ethDelta: 0,
      ratio:    rx(btcMcap, ethMcap)
    },
    {
      label:    "24h Volume",
      btc:      formatUsd(btcVol, 1),
      eth:      formatUsd(ethVol, 1),
      btcDelta: 0,
      ethDelta: 0,
      ratio:    rx(btcVol, ethVol)
    },
    {
      label:    "Vol / MCap %",
      btc:      `${btcVolMcap.toFixed(2)}%`,
      eth:      `${ethVolMcap.toFixed(2)}%`,
      btcDelta: 0,
      ethDelta: 0,
      ratio:    ethVolMcap > 0 ? `${(btcVolMcap / ethVolMcap).toFixed(2)}x` : na
    },
    {
      label:    "DeFi TVL Exposure",
      btc:      formatUsd(totals?.btcTotal   ?? 0, 1),
      eth:      formatUsd(totals?.ethTotal   ?? 0, 1),
      btcDelta: 0,
      ethDelta: 0,
      ratio:    totals?.btcTotal && totals.ethTotal ? rx(totals.btcTotal, totals.ethTotal) : na
    },
    {
      label:    "DeFi Lending TVL",
      btc:      formatUsd(totals?.btcLending ?? 0, 1),
      eth:      formatUsd(totals?.ethLending ?? 0, 1),
      btcDelta: 0,
      ethDelta: 0,
      ratio:    totals?.btcLending && totals.ethLending ? rx(totals.btcLending, totals.ethLending) : na
    },
    {
      label:    "Aave TVL (WBTC/ETH)",
      btc:      totals?.aaveBtcTvl ? formatUsd(totals.aaveBtcTvl, 1) : na,
      eth:      totals?.aaveEthTvl ? formatUsd(totals.aaveEthTvl, 1) : na,
      btcDelta: 0,
      ethDelta: 0,
      ratio:    totals?.aaveBtcTvl && totals.aaveEthTvl ? rx(totals.aaveBtcTvl, totals.aaveEthTvl) : na
    },
    {
      label:    "DeFi LP TVL",
      btc:      formatUsd(totals?.btcLp      ?? 0, 1),
      eth:      formatUsd(totals?.ethLp      ?? 0, 1),
      btcDelta: 0,
      ethDelta: 0,
      ratio:    totals?.btcLp && totals.ethLp ? rx(totals.btcLp, totals.ethLp) : na
    },
    {
      label:    "MCap / DeFi TVL",
      btc:      btcMcapTvl > 0 ? `${btcMcapTvl.toFixed(1)}x` : na,
      eth:      ethMcapTvl > 0 ? `${ethMcapTvl.toFixed(1)}x` : na,
      btcDelta: 0,
      ethDelta: 0,
      ratio:    na
    },
    {
      label:    "Dominance",
      btc:      `${(globalMarket?.btcDominance ?? 0).toFixed(1)}%`,
      eth:      `${(globalMarket?.ethDominance ?? 0).toFixed(1)}%`,
      btcDelta: 0,
      ethDelta: 0,
      ratio:    globalMarket ? rx(globalMarket.btcDominance, globalMarket.ethDominance) : na
    },
    {
      label:    "7-Day Return",
      btc:      analytics ? pct(analytics.btc7d) : na,
      eth:      analytics ? pct(analytics.eth7d) : na,
      btcDelta: analytics?.btc7d ?? 0,
      ethDelta: analytics?.eth7d ?? 0,
      ratio:    na
    },
    {
      label:    "24h Price Change",
      btc:      pct(btcChange),
      eth:      pct(ethChange),
      btcDelta: btcChange,
      ethDelta: ethChange,
      ratio:    na
    }
  ];

  const dominanceData = useMemo(() => {
    const b = globalMarket?.btcDominance ?? 0;
    const e = globalMarket?.ethDominance ?? 0;
    return [
      { name: "BTC",   value: parseFloat(b.toFixed(1)),               fill: "#F7931A" },
      { name: "ETH",   value: parseFloat(e.toFixed(1)),               fill: "#5B7FFF" },
      { name: "Other", value: parseFloat((100 - b - e).toFixed(1)),   fill: "#4a4a6a" }
    ];
  }, [globalMarket]);

  const chainBarData = chains.slice(0, 10).map((c: { name: string; tvl: number }) => ({
    name: c.name.length > 12 ? c.name.slice(0, 11) + "..." : c.name,
    tvl:  c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF"
        : c.name === "Bitcoin"  ? "#F7931A"
        : c.name === "Solana"   ? "#9B5BFF"
        : "#06D6A0"
  }));

  // ---- Render --------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">BTC vs ETH Deep Analysis</h1>
        <DataSources sources={["coingecko", "defillama", "defillamaYields", "binance", "feargreed", "coinglass", "dune", "tokenterminal", "pulsechain", "omnibridge"]} />
        <RefreshBadge
          lastUpdated={marketUpdated || defiUpdated}
          onRefresh={() => { refetchMarket(); refetchDefi(); }}
          intervalMs={90_000}
          isRefreshing={marketFetching || tvlFetching || defiFetching}
        />
      </div>

      {/* Global market strip */}
      {isLoading ? (
        <div className="flex gap-4 rounded-xl border border-white/10 bg-black/30 px-5 py-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-28" />)}
        </div>
      ) : globalMarket ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-black/30 px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            Total MCap{" "}
            <strong className="ml-1 text-foreground">{formatUsd(globalMarket.totalMarketCap, 1)}</strong>
          </span>
          <span className="text-muted-foreground">
            24h Vol{" "}
            <strong className="ml-1 text-foreground">{formatUsd(globalMarket.total24hVolume, 1)}</strong>
          </span>
          <span className="text-muted-foreground">
            Active Coins{" "}
            <strong className="ml-1 text-foreground">{globalMarket.activeCryptos.toLocaleString()}</strong>
          </span>
          <span className="text-muted-foreground">
            MCap Change{" "}
            <strong className={`ml-1 ${globalMarket.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {pct(globalMarket.change24h)}
            </strong>
          </span>
          {defiOverview && (
            <>
              <span className="text-muted-foreground">
                DEX Vol 24h{" "}
                <strong className="ml-1 text-foreground">{formatUsd(defiOverview.dexVolume24h, 1)}</strong>
              </span>
              <span className="text-muted-foreground">
                Protocol Fees 24h{" "}
                <strong className="ml-1 text-foreground">{formatUsd(defiOverview.fees24h, 1)}</strong>
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* Performance banner */}
      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-white/5 bg-black/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">7-Day Winner</p>
              <p className={`text-2xl font-bold mt-1 ${
                winner === "BTC" ? "text-[#F7931A]" :
                winner === "ETH" ? "text-[#5B7FFF]" : "text-muted-foreground"}`}>
                {winner === "TIED" ? "Tied" : winner}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {winner !== "TIED"
                  ? `${Math.abs(analytics.spread).toFixed(2)}% outperformance`
                  : "Returns within 0.5%"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-black/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">7D Correlation (Pearson r)</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{analytics.r.toFixed(3)}</p>
              <p className="text-xs mt-1" style={{ color: corrLabel(analytics.r).color }}>
                {corrLabel(analytics.r).text}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-black/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Market Signal</p>
              {signal ? (
                <>
                  <p className="text-sm font-semibold mt-1" style={{ color: signal.color }}>
                    {signal.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {signal.icon === "bullish"
                      ? <CheckCircle className="inline h-3 w-3 mr-1" />
                      : signal.icon === "bearish"
                      ? <AlertCircle className="inline h-3 w-3 mr-1" />
                      : <Zap className="inline h-3 w-3 mr-1" />}
                    RSI + Fear &amp; Greed composite
                  </p>
                </>
              ) : <Skeleton className="h-6 w-32 mt-1" />}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {/* RSI + Fear & Greed */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/5 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">RSI Analysis (7-Day Closes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics ? (
              <>
                {[
                  { label: "BTC RSI", val: analytics.btcRsi, color: "#F7931A" },
                  { label: "ETH RSI", val: analytics.ethRsi, color: "#5B7FFF" }
                ].map(({ label, val, color }) => {
                  const info = rsiLabel(val);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-mono" style={{ color: info.color }}>{info.text}</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                          style={{ width: `${val ?? 50}%`, background: color }}
                        />
                        <div className="absolute top-0 h-full w-px bg-rose-500/60"    style={{ left: "70%" }} />
                        <div className="absolute top-0 h-full w-px bg-emerald-500/60" style={{ left: "30%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>0 (Oversold)</span><span>50</span><span>(Overbought) 100</span>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                  Red line = overbought (70). Green line = oversold (30). Computed from 7-day daily closes.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fear &amp; Greed Index - Alternative.me</CardTitle>
          </CardHeader>
          <CardContent>
            {fng ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold" style={{ color: fngColor(fng.value) }}>
                    {fng.value}
                  </span>
                  <span className="mb-1 text-sm font-semibold" style={{ color: fngColor(fng.value) }}>
                    {fng.classification}
                  </span>
                </div>
                <div
                  className="relative h-3 overflow-hidden rounded-full"
                  style={{ background: "linear-gradient(to right, #EF4444, #F97316, #EAB308, #22C55E, #06D6A0)" }}
                >
                  <div
                    className="absolute top-0 h-full w-1 rounded-full bg-white shadow-lg"
                    style={{ left: `calc(${fng.value}% - 2px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Extreme Fear</span>
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                  <span>Extreme Greed</span>
                </div>
                <p className="text-xs text-muted-foreground border-t border-white/5 pt-2">
                  {fngSignal(fng.value)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Updated: {fng.timestamp.toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Skeleton className="h-12 w-20 rounded-xl" />
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Correlation Scorecard */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Correlation Scorecard</CardTitle>
            <div className="flex gap-3 text-xs">
              <ColorBadge label="BTC" color="#F7931A" />
              <ColorBadge label="ETH" color="#5B7FFF" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="space-y-2 px-6 py-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-3 text-left">Metric</th>
                  <th className="px-6 py-3 text-right text-[#F7931A]">BTC</th>
                  <th className="px-6 py-3 text-right text-[#5B7FFF]">ETH</th>
                  <th className="px-6 py-3 text-right">BTC / ETH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row: { label: string; btc: string; eth: string; btcDelta: number; ethDelta: number; ratio: string }) => (
                  <tr key={row.label} className="transition-colors hover:bg-white/[0.02]">
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
          )}
        </CardContent>
      </Card>

      {/* 7-Day Normalized Chart */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle>7-Day Relative Performance (Indexed to 100)</CardTitle>
        </CardHeader>
        <CardContent>
          {normalizedSparklines && normalizedSparklines.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={normalizedSparklines} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F7931A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5B7FFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5B7FFF" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7595" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7595" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${(v as number).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,12,24,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12
                  }}
                  formatter={(v: number, name: string) => [
                    `${v.toFixed(2)}`,
                    name === "btc" ? "BTC" : "ETH"
                  ]}
                />
                <Area type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2} fill="url(#btcGrad)" />
                <Area type="monotone" dataKey="eth" stroke="#5B7FFF" strokeWidth={2} fill="url(#ethGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-64 w-full rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">Loading 7-day chart from CoinGecko...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dominance + Chain TVL */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Market Cap Dominance</CardTitle></CardHeader>
          <CardContent>
            {!globalMarket ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dominanceData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7595" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7595" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,12,24,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12
                    }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {dominanceData.map((e: { name: string; value: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Chain TVL - Top 10</CardTitle></CardHeader>
          <CardContent>
            {!chainBarData.length ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chainBarData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#6b7595" }}
                    tickFormatter={(v) => formatUsd(v as number, 0)}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,12,24,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12
                    }}
                    formatter={(v: number) => [formatUsd(v, 1)]}
                  />
                  <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
                    {chainBarData.map((e: { name: string; tvl: number; fill: string }) => <Cell key={e.name} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top DEXes */}
      {defiOverview && defiOverview.topDexes.length > 0 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Top DEXes by 24h Volume</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {defiOverview.topDexes.map((dex: { name: string; volume24h: number; logo?: string }, i: number) => {
                const sharePct = defiOverview.dexVolume24h > 0
                  ? (dex.volume24h / defiOverview.dexVolume24h) * 100
                  : 0;
                return (
                  <div key={dex.name} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{dex.name}</span>
                    <div className="w-32 overflow-hidden rounded-full bg-white/5 h-1.5">
                      <div
                        className="h-full rounded-full bg-[#06D6A0]"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-mono text-sm">{formatUsd(dex.volume24h, 1)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">
                      {sharePct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Hub */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader><CardTitle className="text-base">DeFi Resource Hub</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                category: "Analytics & TVL",
                links: [
                  { label: "DefiLlama", desc: "TVL rankings & protocols", href: "https://defillama.com", color: "#2172e5" },
                  { label: "DefiLlama Chains", desc: "Chain TVL breakdown", href: "https://defillama.com/chains", color: "#2172e5" },
                  { label: "DefiLlama Yields", desc: "Best DeFi APYs", href: "https://defillama.com/yields", color: "#2172e5" },
                  { label: "Token Terminal", desc: "Protocol revenues & P/E", href: "https://tokenterminal.com", color: "#a78bfa" },
                  { label: "Dune Analytics", desc: "On-chain SQL analytics", href: "https://dune.com", color: "#e67bf0" },
                  { label: "Messari", desc: "Research & asset profiles", href: "https://messari.io", color: "#06d6a0" },
                ]
              },
              {
                category: "Market Data",
                links: [
                  { label: "CoinGecko", desc: "Prices, market cap, history", href: "https://www.coingecko.com", color: "#8dc63f" },
                  { label: "CoinMarketCap", desc: "Market rankings & data", href: "https://coinmarketcap.com", color: "#3861fb" },
                  { label: "Fear & Greed Index", desc: "Crypto sentiment gauge", href: "https://alternative.me/crypto/fear-and-greed-index/", color: "#ef4444" },
                  { label: "Coinglass", desc: "Funding rates & open interest", href: "https://www.coinglass.com", color: "#00c3ff" },
                  { label: "TradingView", desc: "Advanced charting", href: "https://www.tradingview.com/chart/?symbol=BINANCE:ETHBTC", color: "#2962ff" },
                ]
              },
              {
                category: "Exchanges & DeFi",
                links: [
                  { label: "Binance Spot", desc: "BTC/ETH trading", href: "https://www.binance.com/en/trade/BTC_USDT", color: "#F0B90B" },
                  { label: "Binance Futures", desc: "BTC/ETH perpetuals", href: "https://www.binance.com/en/futures/BTCUSDT", color: "#F0B90B" },
                  { label: "Uniswap", desc: "EVM DEX liquidity", href: "https://app.uniswap.org", color: "#FF007A" },
                  { label: "Aave", desc: "BTC/ETH lending markets", href: "https://app.aave.com", color: "#B6509E" },
                  { label: "DefiLlama DEX", desc: "Top DEX volumes", href: "https://defillama.com/dexs", color: "#2172e5" },
                  { label: "DefiLlama Fees", desc: "Protocol fee revenue", href: "https://defillama.com/fees", color: "#2172e5" },
                ]
              },
              {
                category: "On-Chain Explorers",
                links: [
                  { label: "Etherscan", desc: "Ethereum explorer", href: "https://etherscan.io", color: "#3498db" },
                  { label: "Solscan", desc: "Solana explorer", href: "https://solscan.io", color: "#9945ff" },
                  { label: "Nansen", desc: "Smart money tracker", href: "https://app.nansen.ai", color: "#f97316" },
                  { label: "BTC Explorer", desc: "Bitcoin explorer", href: "https://mempool.space", color: "#F7931A" },
                  { label: "Dune BTC/ETH", desc: "Custom BTC/ETH dashboards", href: "https://dune.com/browse/dashboards?q=btc+eth", color: "#e67bf0" },
                ]
              }
            ].map((group) => (
              <div key={group.category} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{group.category}</p>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5"
                    >
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: link.color }} />
                      <div>
                        <p className="text-sm font-medium leading-none" style={{ color: link.color }}>{link.label}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{link.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PulseChain spotlight */}
      <Card className="border-[#9333ea]/30 bg-[#9333ea]/5">
        <CardHeader>
          <CardTitle className="text-base">PulseChain Spotlight</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-muted-foreground">PulseChain TVL</p>
            <p className="mt-1 text-lg font-semibold text-[#9333ea]">{pulseData ? formatUsd(pulseData.plsTvl, 2) : "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-muted-foreground">PLS Price</p>
            <p className="mt-1 text-lg font-semibold text-[#9333ea]">{pulseData?.plsPrice ? `$${pulseData.plsPrice.toFixed(6)}` : "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-muted-foreground">OmniBridge 24h Volume</p>
            <p className="mt-1 text-lg font-semibold text-[#9333ea]">
              {pulseData?.bridge24hVolume !== null && pulseData?.bridge24hVolume !== undefined
                ? formatUsd(pulseData.bridge24hVolume, 2)
                : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-muted-foreground">Latest Block</p>
            <p className="mt-1 text-lg font-semibold text-[#9333ea]">{pulseData?.latestBlock ? `#${pulseData.latestBlock.toLocaleString()}` : "—"}</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

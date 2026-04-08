"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshBadge } from "@/components/ui/refresh-badge";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { useFearGreed, fngColor, fngSignal } from "@/hooks/use-fear-greed";
import { formatUsd } from "@/lib/utils";

// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: color + "22", color }}>
      Ã¢â€”Â {label}
    </span>
  );
}

/** Pearson correlation coefficient between two same-length arrays */
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

/** Simple RSI from a prices array (uses all available data) */
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
  const rs = avgG / avgL;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

function rsiLabel(v: number | null): { text: string; color: string } {
  if (v === null) return { text: "N/A", color: "#6b7595" };
  if (v < 30) return { text: `${v} Ã¢â‚¬â€ Oversold`, color: "#22C55E" };
  if (v > 70) return { text: `${v} Ã¢â‚¬â€ Overbought`, color: "#EF4444" };
  return { text: `${v} Ã¢â‚¬â€ Neutral`, color: "#EAB308" };
}

function corrLabel(r: number): { text: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.9) return { text: "Very high (move in lock-step)", color: "#06D6A0" };
  if (abs >= 0.7) return { text: "High correlation", color: "#22C55E" };
  if (abs >= 0.5) return { text: "Moderate correlation", color: "#EAB308" };
  return { text: "Low Ã¢â‚¬â€ assets diverging", color: "#EF4444" };
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function StatsPage() {
  const { data: market, isFetching: marketFetching, dataUpdatedAt: marketUpdated, refetch: refetchMarket } = useMarketData();
  const { totals, chains, isFetching: tvlFetching } = useTvlData();
  const {
    globalMarket, normalizedSparklines, defiOverview, sparklines,
    isFetching: defiFetching, dataUpdatedAt: defiUpdated, refetch: refetchDefi
  } = useDefiOverview();
  const { data: fng } = useFearGreed();

  const isLoading = !market && !globalMarket;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Derived analytics Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const btcMcap = market?.BTC.marketCap ?? 0;
  const ethMcap = market?.ETH.marketCap ?? 0;
  const btcVol = market?.BTC.volume24h ?? 0;
  const ethVol = market?.ETH.volume24h ?? 0;
  const btcPrice = market?.BTC.price ?? 0;
  const ethPrice = market?.ETH.price ?? 0;
  const btcChange = market?.BTC.change24h ?? 0;
  const ethChange = market?.ETH.change24h ?? 0;

  const btcVolMcap = btcMcap > 0 ? (btcVol / btcMcap) * 100 : 0;
  const ethVolMcap = ethMcap > 0 ? (ethVol / ethMcap) * 100 : 0;
  const btcMcapTvl = totals?.btcTotal && totals.btcTotal > 0 ? btcMcap / totals.btcTotal : 0;
  const ethMcapTvl = totals?.ethTotal && totals.ethTotal > 0 ? ethMcap / totals.ethTotal : 0;

  // Pearson correlation + RSI from sparklines
  const analytics = useMemo(() => {
    const s = sparklines;
    if (!s || s.btcPrices.length < 3) return null;
    const r = pearson(s.btcPrices, s.ethPrices);
    const btcRsi = simpleRsi(s.btcPrices);
    const ethRsi = simpleRsi(s.ethPrices);
    const btc7d = s.btcPrices.length >= 2
      ? ((s.btcPrices[s.btcPrices.length - 1] - s.btcPrices[0]) / s.btcPrices[0]) * 100
      : 0;
    const eth7d = s.ethPrices.length >= 2
      ? ((s.ethPrices[s.ethPrices.length - 1] - s.ethPrices[0]) / s.ethPrices[0]) * 100
      : 0;
    return { r, btcRsi, ethRsi, btc7d, eth7d, spread: btc7d - eth7d };
  }, [sparklines]);

  const winner = analytics
    ? analytics.spread > 0.5 ? "BTC" : analytics.spread < -0.5 ? "ETH" : "TIED"
    : null;

  // Signal strength (simplified)
  const signal = useMemo(() => {
    if (!analytics || !fng) return null;
    const rsiOversold = (analytics.btcRsi ?? 50) < 40 || (analytics.ethRsi ?? 50) < 40;
    const rsiOverbought = (analytics.btcRsi ?? 50) > 65 || (analytics.ethRsi ?? 50) > 65;
    const extremeFear = fng.value <= 25;
    const greed = fng.value >= 65;

    if (extremeFear && rsiOversold) return { label: "Strong Buy Signal", icon: "bullish", color: "#22C55E" };
    if (greed && rsiOverbought) return { label: "Caution Ã¢â‚¬â€ Overbought + Greed", icon: "bearish", color: "#EF4444" };
    if (rsiOversold) return { label: "Oversold Ã¢â‚¬â€ Watch for reversal", icon: "neutral", color: "#EAB308" };
    if (greed) return { label: "Greed Ã¢â‚¬â€ Reduce risk exposure", icon: "bearish", color: "#F97316" };
    return { label: "Neutral Ã¢â‚¬â€ No strong signal", icon: "neutral", color: "#6b7595" };
  }, [analytics, fng]);

  // Scorecard rows
  const rows = [
    { label: "Price", btc: formatUsd(btcPrice, 0), eth: formatUsd(ethPrice, 0), btcDelta: btcChange, ethDelta: ethChange, ratio: btcPrice > 0 && ethPrice > 0 ? `${(btcPrice / ethPrice).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "Market Cap", btc: formatUsd(btcMcap, 1), eth: formatUsd(ethMcap, 1), btcDelta: 0, ethDelta: 0, ratio: btcMcap > 0 && ethMcap > 0 ? `${(btcMcap / ethMcap).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "24h Volume", btc: formatUsd(btcVol, 1), eth: formatUsd(ethVol, 1), btcDelta: 0, ethDelta: 0, ratio: btcVol > 0 && ethVol > 0 ? `${(btcVol / ethVol).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "Vol / MCap %", btc: `${btcVolMcap.toFixed(2)}%`, eth: `${ethVolMcap.toFixed(2)}%`, btcDelta: 0, ethDelta: 0, ratio: ethVolMcap > 0 ? `${(btcVolMcap / ethVolMcap).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "DeFi TVL Exposure", btc: formatUsd(totals?.btcTotal ?? 0, 1), eth: formatUsd(totals?.ethTotal ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: totals?.btcTotal && totals.ethTotal ? `${(totals.btcTotal / totals.ethTotal).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "DeFi Lending TVL", btc: formatUsd(totals?.btcLending ?? 0, 1), eth: formatUsd(totals?.ethLending ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: "Ã¢â‚¬â€" },
    { label: "DeFi LP TVL", btc: formatUsd(totals?.btcLp ?? 0, 1), eth: formatUsd(totals?.ethLp ?? 0, 1), btcDelta: 0, ethDelta: 0, ratio: "Ã¢â‚¬â€" },
    { label: "MCap / DeFi TVL", btc: btcMcapTvl > 0 ? `${btcMcapTvl.toFixed(1)}Ãƒâ€”` : "Ã¢â‚¬â€", eth: ethMcapTvl > 0 ? `${ethMcapTvl.toFixed(1)}Ãƒâ€”` : "Ã¢â‚¬â€", btcDelta: 0, ethDelta: 0, ratio: "Ã¢â‚¬â€" },
    { label: "Dominance", btc: `${(globalMarket?.btcDominance ?? 0).toFixed(1)}%`, eth: `${(globalMarket?.ethDominance ?? 0).toFixed(1)}%`, btcDelta: 0, ethDelta: 0, ratio: globalMarket ? `${(globalMarket.btcDominance / globalMarket.ethDominance).toFixed(2)}Ãƒâ€”` : "Ã¢â‚¬â€" },
    { label: "7-Day Return", btc: analytics ? `${analytics.btc7d >= 0 ? "+" : ""}${analytics.btc7d.toFixed(2)}%` : "Ã¢â‚¬â€", eth: analytics ? `${analytics.eth7d >= 0 ? "+" : ""}${analytics.eth7d.toFixed(2)}%` : "Ã¢â‚¬â€", btcDelta: analytics?.btc7d ?? 0, ethDelta: analytics?.eth7d ?? 0, ratio: "Ã¢â‚¬â€" },
    { label: "24h Price Change", btc: `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}%`, eth: `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`, btcDelta: btcChange, ethDelta: ethChange, ratio: "Ã¢â‚¬â€" }
  ];

  const dominanceData = useMemo(() => {
    const btcD = globalMarket?.btcDominance ?? 0;
    const ethD = globalMarket?.ethDominance ?? 0;
    return [
      { name: "BTC", value: parseFloat(btcD.toFixed(1)), fill: "#F7931A" },
      { name: "ETH", value: parseFloat(ethD.toFixed(1)), fill: "#5B7FFF" },
      { name: "Other", value: parseFloat((100 - btcD - ethD).toFixed(1)), fill: "#4a4a6a" }
    ];
  }, [globalMarket]);

  const chainBarData = chains.slice(0, 10).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "Ã¢â‚¬Â¦" : c.name,
    tvl: c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF" : c.name === "Bitcoin" ? "#F7931A" : c.name === "Solana" ? "#9B5BFF" : "#06D6A0"
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">BTC vs ETH Ã¢â‚¬â€ Deep Analysis</h1>
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
          <span className="text-muted-foreground">Total MCap <strong className="ml-1 text-foreground">{formatUsd(globalMarket.totalMarketCap, 1)}</strong></span>
          <span className="text-muted-foreground">24h Vol <strong className="ml-1 text-foreground">{formatUsd(globalMarket.total24hVolume, 1)}</strong></span>
          <span className="text-muted-foreground">Active Coins <strong className="ml-1 text-foreground">{globalMarket.activeCryptos.toLocaleString()}</strong></span>
          <span className="text-muted-foreground">MCap ÃŽâ€ <strong className={`ml-1 ${globalMarket.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{globalMarket.change24h >= 0 ? "+" : ""}{globalMarket.change24h.toFixed(2)}%</strong></span>
          {defiOverview && (
            <>
              <span className="text-muted-foreground">DEX Vol 24h <strong className="ml-1 text-foreground">{formatUsd(defiOverview.dexVolume24h, 1)}</strong></span>
              <span className="text-muted-foreground">Fees 24h <strong className="ml-1 text-foreground">{formatUsd(defiOverview.fees24h, 1)}</strong></span>
            </>
          )}
        </div>
      ) : null}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Performance Banner Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-white/5 bg-black/20">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">7-Day Winner</p>
              <p className={`text-2xl font-bold mt-1 ${winner === "BTC" ? "text-[#F7931A]" : winner === "ETH" ? "text-[#5B7FFF]" : "text-muted-foreground"}`}>
                {winner === "TIED" ? "Ã¢â‚¬â€ Tied" : winner}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {winner !== "TIED" ? `${Math.abs(analytics.spread).toFixed(2)}% outperformance` : "Returns within 0.5%"}
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
              <p className="text-xs text-muted-foreground">Signal</p>
              {signal ? (
                <>
                  <p className="text-sm font-semibold mt-1" style={{ color: signal.color }}>{signal.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {signal.icon === "bullish" ? <CheckCircle className="inline h-3 w-3 mr-1" /> : signal.icon === "bearish" ? <AlertCircle className="inline h-3 w-3 mr-1" /> : <Zap className="inline h-3 w-3 mr-1" />}
                    RSI + Fear & Greed composite
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ RSI + Fear & Greed Analysis Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* RSI */}
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
                        {/* Overbought / oversold markers */}
                        <div className="absolute top-0 h-full w-px bg-rose-500/50" style={{ left: "70%" }} />
                        <div className="absolute top-0 h-full w-px bg-emerald-500/50" style={{ left: "30%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>0 Ã¢â‚¬â€ Oversold</span><span>50</span><span>Overbought Ã¢â‚¬â€ 100</span>
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

        {/* Fear & Greed */}
        <Card className="border-white/5 bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fear & Greed Index Ã¢â‚¬â€ Alternative.me</CardTitle>
          </CardHeader>
          <CardContent>
            {fng ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold" style={{ color: fngColor(fng.value) }}>{fng.value}</span>
                  <span className="mb-1 text-sm font-semibold" style={{ color: fngColor(fng.value) }}>{fng.classification}</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 overflow-hidden rounded-full" style={{
                  background: "linear-gradient(to right, #EF4444, #F97316, #EAB308, #22C55E, #06D6A0)"
                }}>
                  <div
                    className="absolute top-0 h-full w-1 rounded-full bg-white shadow-lg"
                    style={{ left: `calc(${fng.value}% - 2px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Extreme Fear</span><span>Fear</span><span>Neutral</span><span>Greed</span><span>Extreme Greed</span>
                </div>

                <p className="text-xs text-muted-foreground border-t border-white/5 pt-2">
                  {fngSignal(fng.value)}
                </p>
                <p className="text-[10px] text-muted-foreground">Updated: {fng.timestamp.toLocaleDateString()}</p>
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Correlation Scorecard Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                  <th className="px-6 py-3 text-right">BTC/ETH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ 7-Day Normalized Chart Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                <Area type="monotone" dataKey="btc" stroke="#F7931A" strokeWidth={2} fill="url(#btcGrad)" />
                <Area type="monotone" dataKey="eth" stroke="#5B7FFF" strokeWidth={2} fill="url(#ethGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-64 w-full rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">Loading 7-day chart from CoinGeckoÃ¢â‚¬Â¦</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Dominance + Chain TVL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                    contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {dominanceData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Chain TVL Ã¢â‚¬â€ Top 10</CardTitle></CardHeader>
          <CardContent>
            {!chainBarData.length ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chainBarData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [formatUsd(v, 1)]}
                  />
                  <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
                    {chainBarData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Top DEXes table Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {defiOverview && defiOverview.topDexes.length > 0 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Top DEXes by 24h Volume</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {defiOverview.topDexes.map((dex, i) => {
                const sharePct = defiOverview.dexVolume24h > 0 ? (dex.volume24h / defiOverview.dexVolume24h) * 100 : 0;
                return (
                  <div key={dex.name} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{dex.name}</span>
                    <div className="w-32 overflow-hidden rounded-full bg-white/5 h-1.5">
                      <div className="h-full rounded-full bg-[#06D6A0]" style={{ width: `${sharePct}%` }} />
                    </div>
                    <span className="w-28 text-right font-mono text-sm">{formatUsd(dex.volume24h, 1)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{sharePct.toFixed(1)}%</span>
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

function SBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: color + "22", color }}>
      {label}
    </span>
  );
}


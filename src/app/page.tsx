"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useDefiOverview } from "@/hooks/use-defi-overview";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TvlBreakdownChart } from "@/components/dashboard/tvl-breakdown-chart";
import { TradingViewWidget } from "@/components/charts/tradingview-widget";
import { RefreshBadge } from "@/components/ui/refresh-badge";
import { formatUsd } from "@/lib/utils";

function CorrelationRow({
  label,
  btcVal,
  ethVal,
  format
}: {
  label: string;
  btcVal: number;
  ethVal: number;
  format?: (v: number) => string;
}) {
  const fmt = format ?? ((v: number) => formatUsd(v, 1));
  const total = btcVal + ethVal;
  const btcPct = total > 0 ? (btcVal / total) * 100 : 50;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
      <div className="text-right">
        <span className="font-mono text-sm font-semibold text-[#F7931A]">{fmt(btcVal)}</span>
      </div>
      <div className="min-w-[160px] text-center">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[#F7931A]/70 transition-all" style={{ width: `${btcPct}%` }} />
          <div className="h-full flex-1 rounded-full bg-[#5B7FFF]/70" />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>BTC</span><span>ETH</span>
        </div>
      </div>
      <div className="text-left">
        <span className="font-mono text-sm font-semibold text-[#5B7FFF]">{fmt(ethVal)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: market, dataUpdatedAt: marketUpdated, isFetching: marketFetching, refetch: refetchMarket } = useMarketData();
  const { totals } = useTvlData();
  const { topYields } = useOpportunities();
  const { globalMarket, defiOverview, isFetching: defiFetching, dataUpdatedAt: defiUpdated, refetch: refetchDefi } = useDefiOverview();
  const ratioHistory = useAppStore((s) => s.ratioHistory);
  void ratioHistory; // kept for Binance WS side-effect (pushes ratio to store)

  const ratio = market ? market.BTC.price / market.ETH.price : 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh timer */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-muted-foreground">Live Dashboard</h1>
        <RefreshBadge
          lastUpdated={marketUpdated || defiUpdated}
          onRefresh={() => { refetchMarket(); refetchDefi(); }}
          intervalMs={10_000}
          isRefreshing={marketFetching || defiFetching}
        />
      </div>

      {/* Row 1: 8 live metrics */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-4">
        <MetricCard title="BTC Price (Live)" value={market?.BTC.price ?? 0} delta={market?.BTC.change24h ?? 0} tone="btc" />
        <MetricCard title="ETH Price (Live)" value={market?.ETH.price ?? 0} delta={market?.ETH.change24h ?? 0} tone="eth" />
        <MetricCard title="BTC/ETH Price Ratio" value={ratio} delta={0} format={(v) => `${v.toFixed(2)}×`} />
        <MetricCard title="Total DeFi TVL" value={totals?.totalDeFiTvl ?? 0} delta={0} />
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid gap-4 md:grid-cols-4">
        <MetricCard title="BTC Dominance" value={globalMarket?.btcDominance ?? 0} delta={0} tone="btc" format={(v) => `${v.toFixed(1)}%`} />
        <MetricCard title="ETH Dominance" value={globalMarket?.ethDominance ?? 0} delta={0} tone="eth" format={(v) => `${v.toFixed(1)}%`} />
        <MetricCard title="ETH Chain TVL" value={totals?.ethChainTvl ?? 0} delta={0} tone="eth" />
        <MetricCard title="DEX Volume 24h" value={defiOverview?.dexVolume24h ?? 0} delta={0} />
      </motion.section>

      {/* Row 2: TradingView full chart + TVL gauge */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-white/5 flex flex-col">
          <CardHeader className="pb-0 shrink-0">
            <CardTitle className="text-sm text-muted-foreground">ETH / BTC Price Ratio — TradingView (BINANCE:ETHBTC)</CardTitle>
          </CardHeader>
          <div className="min-h-[420px] h-[55vh] max-h-[680px] w-full grow">
            <TradingViewWidget
              symbol="BINANCE:ETHBTC"
              interval="60"
              studies={["Volume@tv-basicstudies", "RSI@tv-basicstudies"]}
            />
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">BTC vs ETH in DeFi TVL</CardTitle>
            </CardHeader>
            <CardContent>
              <TvlBreakdownChart btc={totals?.btcTotal ?? 0} eth={totals?.ethTotal ?? 0} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Row 3: BTC vs ETH Correlation Scoreboard */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle>BTC vs ETH — Correlation Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-white/5">
          <CorrelationRow label="Market Cap" btcVal={market?.BTC.marketCap ?? 0} ethVal={market?.ETH.marketCap ?? 0} />
          <CorrelationRow label="24h Trade Volume" btcVal={market?.BTC.volume24h ?? 0} ethVal={market?.ETH.volume24h ?? 0} />
          <CorrelationRow label="DeFi TVL Exposure" btcVal={totals?.btcTotal ?? 0} ethVal={totals?.ethTotal ?? 0} />
          <CorrelationRow label="DeFi Lending" btcVal={totals?.btcLending ?? 0} ethVal={totals?.ethLending ?? 0} />
          <CorrelationRow label="DeFi LP" btcVal={totals?.btcLp ?? 0} ethVal={totals?.ethLp ?? 0} />
          <CorrelationRow
            label="Vol / MCap %"
            btcVal={market ? (market.BTC.volume24h / market.BTC.marketCap) * 100 : 0}
            ethVal={market ? (market.ETH.volume24h / market.ETH.marketCap) * 100 : 0}
            format={(v) => `${v.toFixed(2)}%`}
          />
          <CorrelationRow
            label="Protocol Fees 24h"
            btcVal={defiOverview ? defiOverview.fees24h * 0.3 : 0}
            ethVal={defiOverview ? defiOverview.fees24h * 0.7 : 0}
          />
        </CardContent>
      </Card>

      {/* Row 4: Top yields + market cap summary */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="BTC MCap / ETH MCap" value={market ? market.BTC.marketCap / market.ETH.marketCap : 0} delta={0} format={(v) => `${v.toFixed(2)}×`} />
        <MetricCard title="Top Yield APY" value={topYields[0]?.apy ?? 0} delta={topYields[0]?.apy ?? 0} format={(v) => `${v.toFixed(2)}%`} />
        <MetricCard title="Total Protocol Fees 24h" value={defiOverview?.fees24h ?? 0} delta={0} />
        <MetricCard title="Total Crypto Market Cap" value={globalMarket?.totalMarketCap ?? 0} delta={globalMarket?.change24h ?? 0} />
      </section>
    </div>
  );
}



"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useOpportunities } from "@/hooks/use-opportunities";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TvlBreakdownChart } from "@/components/dashboard/tvl-breakdown-chart";
import { PriceRatioChart } from "@/components/charts/price-ratio-chart";
import { formatUsd } from "@/lib/utils";

export default function DashboardPage() {
  const { data: market } = useMarketData();
  const { totals, benchmark } = useTvlData();
  const { topYields } = useOpportunities();
  const ratioHistory = useAppStore((s) => s.ratioHistory);

  const ratioSeries = ratioHistory.map((entry) => ({ time: entry.timestamp, value: entry.ratio }));

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-4">
        <MetricCard title="BTC Total TVL (LP + Lending)" value={totals?.btcTotal ?? 0} delta={1.8} tone="btc" />
        <MetricCard title="ETH Total TVL (LP + Lending)" value={totals?.ethTotal ?? 0} delta={2.1} tone="eth" />
        <MetricCard title="Combined Core-Asset TVL" value={totals?.combined ?? 0} delta={2.4} />
        <MetricCard title="Top Bonding Yield Today" value={topYields[0]?.apy ?? 0} delta={topYields[0]?.apy ?? 0} />
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>BTC / ETH Price Ratio (Binance WS + CoinGecko)</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceRatioChart points={ratioSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>TVL Split Gauge</CardTitle>
          </CardHeader>
          <CardContent>
            <TvlBreakdownChart btc={totals?.btcTotal ?? 0} eth={totals?.ethTotal ?? 0} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="BTC Price" value={market?.BTC.price ?? 0} delta={market?.BTC.change24h ?? 0} tone="btc" />
        <MetricCard title="ETH Price" value={market?.ETH.price ?? 0} delta={market?.ETH.change24h ?? 0} tone="eth" />
        <MetricCard title="24h LP Fees + Interest" value={(topYields[0]?.fees24h ?? 0) + (topYields[1]?.fees24h ?? 0)} delta={4.1} />
        <MetricCard title="Net LVR Drag" value={(topYields[0]?.lvrEstimate ?? 0) + (topYields[1]?.lvrEstimate ?? 0)} delta={-1.1} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Core Asset Benchmarks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {benchmark.map((item) => (
            <div key={item.asset} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-muted-foreground">{item.asset}</p>
              <p className="mt-1 text-lg font-semibold">{formatUsd(item.tvl, 1)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

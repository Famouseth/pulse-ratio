"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { formatPct } from "@/lib/utils";

export default function StatsPage() {
  const { data: market } = useMarketData();
  const { totals } = useTvlData();

  const share = totals?.combined ? (totals.btcTotal / totals.combined) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">BTC vs ETH On-Chain Stats</h1>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>BTC Dominance</CardTitle></CardHeader><CardContent>{formatPct(market?.BTC.dominance ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>ETH Dominance</CardTitle></CardHeader><CardContent>{formatPct(market?.ETH.dominance ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>BTC TVL Share</CardTitle></CardHeader><CardContent>{formatPct(share)}</CardContent></Card>
        <Card><CardHeader><CardTitle>ETH TVL Share</CardTitle></CardHeader><CardContent>{formatPct(100 - share)}</CardContent></Card>
      </section>
    </div>
  );
}

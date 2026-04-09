"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataSources } from "@/components/ui/data-sources";
import { formatUsd } from "@/lib/utils";
import { TrendingUp, TrendingDown, Zap, BarChart2, Coins } from "lucide-react";

interface ArbData {
  spot: {
    btc: { price: number; change24h: number; volume: number } | null;
    eth: { price: number; change24h: number; volume: number } | null;
  };
  perp: {
    btc: { markPrice: number; indexPrice: number; fundingRate: number; annualizedFunding: number; basis: number; nextFundingTime: number } | null;
    eth: { markPrice: number; indexPrice: number; fundingRate: number; annualizedFunding: number; basis: number; nextFundingTime: number } | null;
  };
  bestBtcRates: { protocol: string; chain: string; symbol: string; apy: number; tvlUsd: number }[];
  bestEthRates: { protocol: string; chain: string; symbol: string; apy: number; tvlUsd: number }[];
  carries: { asset: string; strategy: string; description: string; annualYield: number; type: string }[];
}

function pct(n: number, decimals = 2) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

function RateRow({ item }: { item: { protocol: string; chain: string; symbol: string; apy: number; tvlUsd: number } }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
      <div className="flex flex-col">
        <span className="font-medium text-white">{item.symbol}</span>
        <span className="text-xs text-muted-foreground">{item.protocol} · {item.chain}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-semibold text-emerald-400">{item.apy.toFixed(2)}% APY</span>
        <span className="text-xs text-muted-foreground">{formatUsd(item.tvlUsd, 0)} TVL</span>
      </div>
    </div>
  );
}

export default function ArbPage() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery<ArbData>({
    queryKey: ["arb"],
    queryFn: async () => {
      const res = await fetch("/api/arb");
      if (!res.ok) throw new Error("arb API error");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Arbitrage Scanner</h1>
          <DataSources sources={["binance", "binancePerp", "coinglass", "defillamaYields", "aave", "uniswap"]} />
        </div>
        {isLoading && <Badge className="animate-pulse text-xs">Loading...</Badge>}
        {lastUpdated && <span className="text-xs text-muted-foreground ml-auto">Updated {lastUpdated}</span>}
      </div>

      {error && (
        <Card className="border-rose-500/30 bg-rose-950/20">
          <CardContent className="p-4 text-sm text-rose-400">Failed to load arb data. Retrying...</CardContent>
        </Card>
      )}

      {/* Spot vs Perp Price Panel */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "BTC", spot: data?.spot.btc, perp: data?.perp.btc, color: "text-btc" },
          { label: "ETH", spot: data?.spot.eth, perp: data?.perp.eth, color: "text-eth" }
        ].map(({ label, spot, perp, color }) => (
          <Card key={label} className="border-white/5 bg-black/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4" />
                {label} — Spot vs Perp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {spot ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Binance Spot</p>
                    <p className={`text-xl font-semibold ${color}`}>{formatUsd(spot.price, 0)}</p>
                    <p className={`text-xs mt-1 ${spot.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {spot.change24h >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                      {pct(spot.change24h)} 24h
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Vol: {formatUsd(spot.volume, 0)}</p>
                  </div>
                  {perp && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Perp (Mark)</p>
                      <p className="text-xl font-semibold">{formatUsd(perp.markPrice, 0)}</p>
                      <p className={`text-xs mt-1 ${perp.basis >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Basis: {pct(perp.basis, 3)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Funding: {perp.fundingRate >= 0 ? "+" : ""}{perp.fundingRate.toFixed(4)}% / 8h
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
              )}
              {perp && (
                <div className="rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Annualized funding: </span>
                  <span className={`font-semibold ${perp.annualizedFunding >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {pct(perp.annualizedFunding, 1)} APY
                  </span>
                  <span className="ml-2">— {perp.annualizedFunding >= 0 ? "longs pay shorts (bearish)" : "shorts pay longs (bullish)"}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carry Trade Opportunities */}
      {(data?.carries.length ?? 0) > 0 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Carry Trade Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data!.carries.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-xs">{c.asset}</Badge>
                      <span className="font-medium text-sm">{c.strategy}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-semibold ${c.annualYield >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {pct(c.annualYield, 1)}
                    </p>
                    <p className="text-xs text-muted-foreground">est. annual</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Best DeFi Rates for BTC and ETH */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-btc" />
              Best BTC DeFi Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
            {data?.bestBtcRates.map((r) => <RateRow key={r.protocol + r.symbol + r.chain} item={r} />)}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-eth" />
              Best ETH DeFi Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
            {data?.bestEthRates.map((r) => <RateRow key={r.protocol + r.symbol + r.chain} item={r} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { useTvlData } from "@/hooks/use-tvl-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils";

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const data = rows.map((row) => headers.map((h) => row[h]).join(",")).join("\n");
  return `${headers.join(",")}\n${data}`;
}

export default function TvlAnalyticsPage() {
  const { chains, totals, isFetching } = useTvlData();

  const totalDeFi = totals?.totalDeFiTvl ?? 0;

  const exportCsv = () => {
    const rows = chains.map((c) => ({ name: c.name, tvl_usd: c.tvl, change_1d_pct: c.change1d, change_7d_pct: c.change7d }));
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "pulse-ratio-chain-tvl.csv"; a.click();
  };

  // Chain bar chart â€” top 12
  const chartData = chains.slice(0, 12).map((c) => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + "â€¦" : c.name,
    tvl: c.tvl,
    fill: c.name === "Ethereum" ? "#5B7FFF" : c.name === "Bitcoin" ? "#F7931A" : c.name === "Solana" ? "#9B5BFF" : c.name === "Tron" ? "#EF4444" : "#06D6A0"
  }));

  // BTC vs ETH in DeFi comparison
  const defiCompare = [
    { name: "BTC Lending", value: totals?.btcLending ?? 0, fill: "#F7931A" },
    { name: "BTC LP", value: totals?.btcLp ?? 0, fill: "#d4700e" },
    { name: "ETH Lending", value: totals?.ethLending ?? 0, fill: "#5B7FFF" },
    { name: "ETH LP", value: totals?.ethLp ?? 0, fill: "#3a5cd4" }
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">TVL Analytics</h1>
        {isFetching && <Badge variant="default" className="text-xs animate-pulse">Refreshingâ€¦</Badge>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-eth/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ethereum Chain TVL</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-eth">{formatUsd(totals?.ethChainTvl ?? 0, 1)}</p>
            <p className="text-xs text-muted-foreground mt-1">ETH DeFi ecosystem total</p>
          </CardContent>
        </Card>
        <Card className="border-btc/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">BTC in DeFi (All Chains)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-btc">{formatUsd(totals?.btcTotal ?? 0, 1)}</p>
            <p className="text-xs text-muted-foreground mt-1">wBTC, tBTC, solvBTC pools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ETH in DeFi (Pools)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatUsd(totals?.ethTotal ?? 0, 1)}</p>
            <p className="text-xs text-muted-foreground mt-1">stETH, rETH, wETH pools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total DeFi TVL</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatUsd(totalDeFi, 1)}</p>
            <p className="text-xs text-muted-foreground mt-1">All chains combined</p>
          </CardContent>
        </Card>
      </section>

      {/* Chain TVL bar chart */}
      {chartData.length > 0 && (
        <Card className="border-white/5 bg-black/20">
          <CardHeader><CardTitle>Chain TVL Ranking (Top 12 Â· DefiLlama)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(v: number) => [formatUsd(v, 1), "TVL"]}
                />
                <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* BTC vs ETH breakdown */}
      {defiCompare.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/5 bg-black/20">
            <CardHeader><CardTitle>BTC vs ETH â€” DeFi Split</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={defiCompare} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a8b3cf" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7595" }} tickFormatter={(v) => formatUsd(v, 0)} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [formatUsd(v, 1)]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {defiCompare.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chain table */}
          <Card className="border-white/5 bg-black/20">
            <CardHeader><CardTitle>All Chains Table</CardTitle></CardHeader>
            <CardContent className="p-0 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-black/80 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Chain</th>
                    <th className="px-4 py-2 text-right">TVL</th>
                    <th className="px-4 py-2 text-right">1d %</th>
                    <th className="px-4 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {chains.map((c) => {
                    const share = totalDeFi > 0 ? (c.tvl / totalDeFi) * 100 : 0;
                    return (
                      <tr key={c.name} className="hover:bg-white/3">
                        <td className="px-4 py-2 font-medium">{c.name}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatUsd(c.tvl, 1)}</td>
                        <td className={`px-4 py-2 text-right text-xs ${c.change1d >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {c.change1d >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                          {" "}{Math.abs(c.change1d).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-muted-foreground">{share.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


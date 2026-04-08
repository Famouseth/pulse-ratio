"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import { useTvlData } from "@/hooks/use-tvl-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const data = rows.map((row) => headers.map((h) => row[h]).join(",")).join("\n");
  return `${headers.join(",")}\n${data}`;
}

export default function TvlAnalyticsPage() {
  const { data, totals } = useTvlData();

  const csvRows = useMemo(
    () =>
      (data ?? []).slice(0, 200).map((item) => ({
        protocol: item.protocol,
        chain: item.chain,
        category: item.category,
        asset: item.asset,
        tvl: item.tvl
      })),
    [data]
  );

  const exportCsv = () => {
    const blob = new Blob([toCsv(csvRows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-ratio-tvl.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-ratio-tvl.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">TVL Analytics</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button variant="outline" onClick={exportJson}><Download className="mr-2 h-4 w-4" />JSON</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>BTC TVL</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatUsd(totals?.btcTotal ?? 0, 1)}</p><p className="text-sm text-muted-foreground">LP + Lending</p></CardContent></Card>
        <Card><CardHeader><CardTitle>ETH TVL</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatUsd(totals?.ethTotal ?? 0, 1)}</p><p className="text-sm text-muted-foreground">LP + Lending</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Combined</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatUsd(totals?.combined ?? 0, 1)}</p><p className="text-sm text-muted-foreground">BTC + ETH Core TVL</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Breakdown (DEX LP vs Lending by Chain)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data ?? []).slice(0, 25).map((row) => (
            <div key={`${row.protocol}-${row.chain}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span>{row.protocol} · {row.chain} · {row.category}</span>
              <span>{formatUsd(row.tvl, 1)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highlighted Lending Venues</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {["Aave V3", "Morpho", "Spark", "Compound", "Kamino", "Marginfi", "Drift"].map((name) => (
            <div key={name} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">Live lending TVL integrated through DefiLlama universe filtering.</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpportunities } from "@/hooks/use-opportunities";

export default function ArbPage() {
  const { data } = useOpportunities();
  const opportunities = (data ?? []).slice(0, 12);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Arbitrage Scanner</h1>
      <Card>
        <CardHeader><CardTitle>Real-Time CEX ↔ DEX + Carry Trades</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {opportunities.map((op) => (
            <div key={op.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span>{op.protocol} {op.symbol} ({op.chain})</span>
              <span>{(op.apy + op.score / 10).toFixed(2)}% est edge</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

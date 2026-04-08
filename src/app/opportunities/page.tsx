"use client";

import { useMemo, useState } from "react";
import { OpportunitiesTable } from "@/components/dashboard/opportunities-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOpportunities } from "@/hooks/use-opportunities";

export default function OpportunitiesPage() {
  const { data } = useOpportunities();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const source = data ?? [];
    const q = filter.toLowerCase();
    if (!q) return source;
    return source.filter((item) =>
      [item.protocol, item.chain, item.type, item.symbol].join(" ").toLowerCase().includes(q)
    );
  }, [data, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">All-Protocol LP & Lending Opportunities</h1>
        <div className="ml-auto w-full max-w-xs">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter chain / protocol / pair" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Unified BTC/ETH Table (EVM + Solana)</CardTitle></CardHeader>
        <CardContent>
          <OpportunitiesTable data={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}

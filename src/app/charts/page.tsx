"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceRatioChart } from "@/components/charts/price-ratio-chart";
import { useAppStore } from "@/store/use-app-store";

const tabs = ["Price Comparison", "Ratio Chart", "TVL Comparison", "Volume vs Fees vs TVL", "Bonding Yield Trends"] as const;

export default function ChartsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Ratio Chart");
  const ratio = useAppStore((s) => s.ratioHistory).map((entry) => ({ time: entry.timestamp, value: entry.ratio }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Charts & Historical</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item} variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>{item}</Button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{tab}</CardTitle></CardHeader>
        <CardContent>
          <PriceRatioChart points={ratio} />
        </CardContent>
      </Card>
    </div>
  );
}

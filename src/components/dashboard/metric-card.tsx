import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPct, formatUsd } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  delta?: number;
  tone?: "btc" | "eth" | "neutral";
}

export function MetricCard({ title, value, delta = 0, tone = "neutral" }: MetricCardProps) {
  const isUp = delta >= 0;

  return (
    <Card className={cn(tone === "btc" && "border-btc/35", tone === "eth" && "border-eth/35")}>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{formatUsd(value, 1)}</p>
        <div className={cn("mt-2 flex items-center gap-1 text-xs", isUp ? "text-emerald-300" : "text-rose-300")}>
          {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {formatPct(delta)}
        </div>
      </CardContent>
    </Card>
  );
}

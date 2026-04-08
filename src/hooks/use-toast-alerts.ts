"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useOpportunities } from "@/hooks/use-opportunities";

export function useToastAlerts() {
  const { totals } = useTvlData();
  const { topYields } = useOpportunities();

  useEffect(() => {
    if (!totals) return;
    if (totals.combined > 100_000_000_000) {
      toast.success("TVL Spike", {
        description: "Combined BTC + ETH TVL crossed $100B across tracked protocols."
      });
    }
  }, [totals]);

  useEffect(() => {
    const best = topYields[0];
    if (!best) return;
    if (best.apy > 40) {
      toast("High Bonding Yield", {
        description: `${best.protocol} ${best.symbol} is above 40% APY.`
      });
    }
  }, [topYields]);
}

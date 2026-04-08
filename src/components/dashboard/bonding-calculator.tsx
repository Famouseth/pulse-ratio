"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateBondingProjection } from "@/lib/bonding-utils";

export function BondingCalculator() {
  const [principal, setPrincipal] = useState(10_000);
  const [discount, setDiscount] = useState(7);
  const [apy, setApy] = useState(18);
  const [vesting, setVesting] = useState(10);

  const result = useMemo(
    () => calculateBondingProjection({ principalUsd: principal, discountPct: discount, baseApy: apy, vestingDays: vesting }),
    [apy, discount, principal, vesting]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Bonding Calculator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} placeholder="Principal USD" />
        <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="Discount %" />
        <Input type="number" value={apy} onChange={(e) => setApy(Number(e.target.value))} placeholder="Base APY %" />
        <Input type="number" value={vesting} onChange={(e) => setVesting(Number(e.target.value))} placeholder="Vesting days" />

        <div className="rounded-xl border border-white/10 bg-black/30 p-4 md:col-span-2">
          <p className="text-sm text-muted-foreground">Projected value</p>
          <p className="mt-1 text-2xl font-semibold">${result.projectedValue.toFixed(2)}</p>
          <p className="mt-2 text-sm">ROI: {result.roiPct.toFixed(2)}%</p>
          <p className="text-sm">Projected APY: {result.projectedApy.toFixed(2)}%</p>
          <p className="text-sm">Break-even: {result.breakEvenDays} days</p>
        </div>
      </CardContent>
    </Card>
  );
}

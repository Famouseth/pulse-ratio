import type { BondingProjection, Opportunity } from "@/types";

interface BondingInputs {
  principalUsd: number;
  discountPct: number;
  baseApy: number;
  vestingDays: number;
}

export function calculateBondingProjection(input: BondingInputs): BondingProjection {
  const discountedValue = input.principalUsd * (1 + input.discountPct / 100);
  const roiPct = ((discountedValue - input.principalUsd) / input.principalUsd) * 100;
  const projectedApy = (roiPct / Math.max(1, input.vestingDays)) * 365 + input.baseApy;
  const breakEvenDays = Math.max(1, Math.round(100 / Math.max(1, projectedApy) * 365));
  const rewardTokenAmount = discountedValue / 1;

  return {
    rewardTokenAmount,
    roiPct,
    projectedApy,
    breakEvenDays,
    projectedValue: discountedValue
  };
}

export function topBondingLeaderboard(opportunities: Opportunity[]) {
  return opportunities
    .map((op) => ({
      ...op,
      bondingApy: op.apy + (op.type === "LP" ? 8 : 5),
      vestingDays: op.type === "LP" ? 7 : 14
    }))
    .sort((a, b) => b.bondingApy - a.bondingApy)
    .slice(0, 20);
}

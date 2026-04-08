import type { TvlProtocolPoint, TvlTotals } from "@/types";

export function aggregateTvl(points: TvlProtocolPoint[]): TvlTotals {
  const totals = {
    btcLending: 0,
    btcLp: 0,
    ethLending: 0,
    ethLp: 0,
    btcTotal: 0,
    ethTotal: 0,
    combined: 0,
    ethChainTvl: 0,
    totalDeFiTvl: 0, aaveBtcTvl: 0, aaveEthTvl: 0
  } satisfies TvlTotals;

  for (const point of points) {
    if (point.asset === "BTC") {
      if (point.category === "lending") totals.btcLending += point.tvl;
      if (point.category === "dex") totals.btcLp += point.tvl;
    }
    if (point.asset === "ETH") {
      if (point.category === "lending") totals.ethLending += point.tvl;
      if (point.category === "dex") totals.ethLp += point.tvl;
    }
  }

  totals.btcTotal = totals.btcLending + totals.btcLp;
  totals.ethTotal = totals.ethLending + totals.ethLp;
  totals.combined = totals.btcTotal + totals.ethTotal;

  return totals;
}

export function getBenchmarkTvl(points: TvlProtocolPoint[]) {
  const byAsset = points.reduce<Record<string, number>>((acc, point) => {
    acc[point.asset] = (acc[point.asset] ?? 0) + point.tvl;
    return acc;
  }, {});

  return [
    { asset: "BTC", tvl: byAsset.BTC ?? 0 },
    { asset: "ETH", tvl: byAsset.ETH ?? 0 },
    { asset: "OTHER", tvl: byAsset.OTHER ?? 0 }
  ];
}

import { NextResponse } from "next/server";
import { z } from "zod";

const chartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()]))
});

const COINGECKO_BASE = process.env.COINGECKO_BASE ?? "https://api.coingecko.com/api/v3";

export const revalidate = 900; // 15 min

export async function GET() {
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch(`${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily`, {
        next: { revalidate: 900 }
      }),
      fetch(`${COINGECKO_BASE}/coins/ethereum/market_chart?vs_currency=usd&days=7&interval=daily`, {
        next: { revalidate: 900 }
      })
    ]);

    if (!btcRes.ok || !ethRes.ok)
      return NextResponse.json({ error: "upstream error" }, { status: 502 });

    const [btcJson, ethJson] = await Promise.all([btcRes.json(), ethRes.json()]);
    const btcData = chartSchema.parse(btcJson);
    const ethData = chartSchema.parse(ethJson);

    const length = Math.min(btcData.prices.length, ethData.prices.length);

    return NextResponse.json({
      timestamps: btcData.prices.slice(0, length).map(([ts]) => ts),
      btcPrices: btcData.prices.slice(0, length).map(([, p]) => p),
      ethPrices: ethData.prices.slice(0, length).map(([, p]) => p)
    }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" }
    });
  } catch {
    return NextResponse.json({ error: "sparklines fetch failed" }, { status: 500 });
  }
}

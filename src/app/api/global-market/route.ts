import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  data: z.object({
    active_cryptocurrencies: z.number(),
    total_market_cap: z.object({ usd: z.number() }),
    total_volume: z.object({ usd: z.number() }),
    market_cap_percentage: z.object({ btc: z.number(), eth: z.number() }),
    market_cap_change_percentage_24h_usd: z.number()
  })
});

const COINGECKO_BASE = process.env.COINGECKO_BASE ?? "https://api.coingecko.com/api/v3";

export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const res = await fetch(`${COINGECKO_BASE}/global`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });

    const json = await res.json();
    const parsed = schema.parse(json);
    const d = parsed.data;

    return NextResponse.json({
      totalMarketCap: d.total_market_cap.usd,
      total24hVolume: d.total_volume.usd,
      btcDominance: d.market_cap_percentage.btc,
      ethDominance: d.market_cap_percentage.eth,
      change24h: d.market_cap_change_percentage_24h_usd,
      activeCryptos: d.active_cryptocurrencies
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" }
    });
  } catch {
    return NextResponse.json({ error: "global market fetch failed" }, { status: 500 });
  }
}

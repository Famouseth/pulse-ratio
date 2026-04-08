import { NextResponse } from "next/server";
import { z } from "zod";

const poolSchema = z.object({
  data: z.array(
    z.object({
      pool: z.string(),
      chain: z.string(),
      project: z.string(),
      symbol: z.string(),
      tvlUsd: z.number().nullable().optional(),
      apy: z.number().nullable().optional(),
      apyBase: z.number().nullable().optional(),
      apyReward: z.number().nullable().optional(),
      volumeUsd1d: z.number().nullable().optional(),
      rewardTokens: z.array(z.string()).optional()
    })
  )
});

const LLAMA_YIELDS_BASE = process.env.LLAMA_YIELDS_BASE ?? "https://yields.llama.fi";

const BTC_KEYWORDS = ["btc", "wbtc", "tbtc", "sbtc", "solvbtc"];
const ETH_KEYWORDS = ["eth", "weth", "steth", "reth", "cbeth", "eeth", "weeth"];
const AAVE_PROJECTS = ["aave-v3", "aave-v2", "aave"];
const LENDING_PROJECTS = new Set([
  "aave-v3", "aave-v2", "aave", "morpho", "compound-v3", "compound-v2",
  "kamino-lend", "venus", "benqi", "spark"
]);

function inferAsset(symbol: string): "BTC" | "ETH" | "OTHER" {
  const s = symbol.toLowerCase();
  if (BTC_KEYWORDS.some((k) => s.includes(k))) return "BTC";
  if (ETH_KEYWORDS.some((k) => s.includes(k))) return "ETH";
  return "OTHER";
}

export const revalidate = 900; // 15 min

export async function GET() {
  try {
    const res = await fetch(`${LLAMA_YIELDS_BASE}/pools`, {
      next: { revalidate: 900 }
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });

    const json = await res.json();
    const parsed = poolSchema.parse(json);

    const relevant = parsed.data.filter(
      (p) => inferAsset(p.symbol) !== "OTHER" && (p.tvlUsd ?? 0) > 10_000
    );

    // Aave-specific TVL aggregation
    let aaveBtcTvl = 0;
    let aaveEthTvl = 0;
    for (const pool of relevant) {
      if (!AAVE_PROJECTS.includes(pool.project)) continue;
      const asset = inferAsset(pool.symbol);
      const tvl = pool.tvlUsd ?? 0;
      if (asset === "BTC") aaveBtcTvl += tvl;
      if (asset === "ETH") aaveEthTvl += tvl;
    }

    const opportunities = relevant.map((pool) => {
      const apy = pool.apy ?? pool.apyBase ?? 0;
      const volume = pool.volumeUsd1d ?? 0;
      const fees = Math.max(0, volume * 0.0025);
      const isLending = LENDING_PROJECTS.has(pool.project);
      const ilEstimate = Math.min(9.9, Math.max(0.2, apy * 0.08));
      const lvrEstimate = Math.min(6, Math.max(0.1, apy * 0.05));
      const score =
        apy * 0.5 +
        Math.log10((pool.tvlUsd ?? 1) + 1) * 8 +
        Math.log10(volume + 1) * 4 -
        ilEstimate -
        lvrEstimate;

      return {
        id: pool.pool,
        chain: pool.chain,
        protocol: pool.project,
        type: isLending ? "Lending" : "LP",
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd ?? 0,
        apy,
        volume24h: volume,
        fees24h: fees,
        ilEstimate,
        lvrEstimate,
        score
      };
    });

    return NextResponse.json({ opportunities, aaveBtcTvl, aaveEthTvl }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" }
    });
  } catch {
    return NextResponse.json({ error: "yields fetch failed" }, { status: 500 });
  }
}

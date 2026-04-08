import { NextResponse } from "next/server";

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(`${LLAMA_YIELDS_BASE}/pools`, {
      signal: controller.signal,
      next: { revalidate: 900 }
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });

    // Lenient parsing — avoid Zod overhead on 5k+ pool objects
    const json = (await res.json()) as { data?: unknown[] };
    const rawPools: unknown[] = Array.isArray(json?.data) ? json.data : [];

    let aaveBtcTvl = 0;
    let aaveEthTvl = 0;
    const opportunities: {
      id: string; chain: string; protocol: string; type: string; symbol: string;
      tvlUsd: number; apy: number; volume24h: number; fees24h: number;
      ilEstimate: number; lvrEstimate: number; score: number;
    }[] = [];

    for (const raw of rawPools) {
      const p = raw as Record<string, unknown>;
      const symbol = typeof p.symbol === "string" ? p.symbol : "";
      const project = typeof p.project === "string" ? p.project : "";
      const chain = typeof p.chain === "string" ? p.chain : "";
      const pool = typeof p.pool === "string" ? p.pool : "";
      const tvlUsd = typeof p.tvlUsd === "number" ? p.tvlUsd : 0;
      const apy = typeof p.apy === "number" ? p.apy : typeof p.apyBase === "number" ? (p.apyBase as number) : 0;
      const volumeUsd1d = typeof p.volumeUsd1d === "number" ? p.volumeUsd1d : 0;

      const asset = inferAsset(symbol);
      if (asset === "OTHER" || tvlUsd < 10_000 || !pool || !chain) continue;

      if (AAVE_PROJECTS.includes(project)) {
        if (asset === "BTC") aaveBtcTvl += tvlUsd;
        if (asset === "ETH") aaveEthTvl += tvlUsd;
      }

      const fees = Math.max(0, volumeUsd1d * 0.0025);
      const isLending = LENDING_PROJECTS.has(project);
      const ilEstimate = Math.min(9.9, Math.max(0.2, apy * 0.08));
      const lvrEstimate = Math.min(6, Math.max(0.1, apy * 0.05));
      const score =
        apy * 0.5 +
        Math.log10(tvlUsd + 1) * 8 +
        Math.log10(volumeUsd1d + 1) * 4 -
        ilEstimate -
        lvrEstimate;

      opportunities.push({
        id: pool, chain, protocol: project,
        type: isLending ? "Lending" : "LP",
        symbol, tvlUsd, apy,
        volume24h: volumeUsd1d,
        fees24h: fees, ilEstimate, lvrEstimate, score
      });
    }

    return NextResponse.json(
      { opportunities, aaveBtcTvl, aaveEthTvl },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
    );
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "yields API timeout" : "yields fetch failed" },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

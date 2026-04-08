import { z } from "zod";
import type { ChainTvlItem, DeFiOverview, Opportunity, TvlProtocolPoint } from "@/types";

const poolsSchema = z.object({
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

const chainTvlSchema = z.array(
  z.object({
    name: z.string(),
    tvl: z.number(),
    gecko_id: z.string().nullable().optional(),
    tokenSymbol: z.string().nullable().optional(),
    change_1d: z.number().nullable().optional(),
    change_7d: z.number().nullable().optional()
  })
);

const LLAMA_PROTOCOLS_BASE = process.env.NEXT_PUBLIC_LLAMA_PROTOCOLS_BASE ?? "https://api.llama.fi";
const LLAMA_YIELDS_BASE = process.env.NEXT_PUBLIC_DEFILLAMA_API_BASE ?? "https://yields.llama.fi";

const BTC_KEYWORDS = ["btc", "wbtc", "tbtc", "sbtc", "solvbtc"];
const ETH_KEYWORDS = ["eth", "weth", "steth", "reth", "cbeth", "eeth", "weeth"];

function matchesKeywords(symbol: string, keywords: string[]) {
  const normalized = symbol.toLowerCase();
  return keywords.some((word) => normalized.includes(word));
}

export function inferAsset(symbol: string): "BTC" | "ETH" | "OTHER" {
  if (matchesKeywords(symbol, BTC_KEYWORDS)) return "BTC";
  if (matchesKeywords(symbol, ETH_KEYWORDS)) return "ETH";
  return "OTHER";
}

export async function fetchChainTVL(): Promise<ChainTvlItem[]> {
  const response = await fetch(`${LLAMA_PROTOCOLS_BASE}/v2/chains`);
  if (!response.ok) throw new Error("DefiLlama chains API error");
  const json = await response.json();
  const parsed = chainTvlSchema.parse(json);

  return parsed
    .filter((c) => c.tvl > 1_000_000)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 25)
    .map((c) => ({
      name: c.name,
      tvl: c.tvl,
      tokenSymbol: c.tokenSymbol ?? c.name.slice(0, 4).toUpperCase(),
      change1d: c.change_1d ?? 0,
      change7d: c.change_7d ?? 0
    }));
}

export async function fetchDeFiOverview(): Promise<DeFiOverview> {
  const [dexRes, feesRes] = await Promise.allSettled([
    fetch(`${LLAMA_PROTOCOLS_BASE}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`),
    fetch(`${LLAMA_PROTOCOLS_BASE}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`)
  ]);

  const dexJson: Record<string, unknown> =
    dexRes.status === "fulfilled" && dexRes.value.ok ? await dexRes.value.json() : {};
  const feesJson: Record<string, unknown> =
    feesRes.status === "fulfilled" && feesRes.value.ok ? await feesRes.value.json() : {};

  const topDexes: Array<{ name: string; volume24h: number }> = (
    Array.isArray(dexJson.protocols) ? (dexJson.protocols as Array<Record<string, unknown>>) : []
  )
    .filter((p) => Number(p.total24h ?? 0) > 0)
    .sort((a, b) => Number(b.total24h ?? 0) - Number(a.total24h ?? 0))
    .slice(0, 5)
    .map((p) => ({
      name: String(p.displayName ?? p.name ?? "Unknown"),
      volume24h: Number(p.total24h ?? 0)
    }));

  return {
    dexVolume24h: Number(dexJson.total24h ?? 0),
    dexVolume7d: Number(dexJson.total7d ?? 0),
    fees24h: Number(feesJson.total24h ?? 0),
    fees7d: Number(feesJson.total7d ?? 0),
    topDexes
  };
}

export async function fetchYieldOpportunities(): Promise<Opportunity[]> {
  const response = await fetch(`${LLAMA_YIELDS_BASE}/pools`);
  if (!response.ok) throw new Error("DefiLlama yields API error");
  const json = await response.json();
  const parsed = poolsSchema.parse(json);

  return parsed.data
    .filter((pool) => inferAsset(pool.symbol) !== "OTHER" && (pool.tvlUsd ?? 0) > 10_000)
    .map((pool) => {
      const apy = pool.apy ?? pool.apyBase ?? 0;
      const volume = pool.volumeUsd1d ?? 0;
      const fees = Math.max(0, volume * 0.0025);
      const ilEstimate = Math.min(9.9, Math.max(0.2, apy * 0.08));
      const lvrEstimate = Math.min(6, Math.max(0.1, apy * 0.05));
      const score =
        apy * 0.5 +
        Math.log10((pool.tvlUsd ?? 1) + 1) * 8 +
        Math.log10(volume + 1) * 4 -
        ilEstimate -
        lvrEstimate;

      const isLending =
        pool.project.toLowerCase().includes("aave") ||
        pool.project.toLowerCase().includes("morpho") ||
        pool.project.toLowerCase().includes("kamino") ||
        pool.project.toLowerCase().includes("compound") ||
        pool.project.toLowerCase().includes("venus") ||
        pool.project.toLowerCase().includes("benqi");

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
      } satisfies Opportunity;
    });
}

export async function fetchProtocolTVLUniverse(): Promise<TvlProtocolPoint[]> {
  return [];
}

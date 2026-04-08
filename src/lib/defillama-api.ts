import { z } from "zod";
import type { Opportunity, TvlProtocolPoint } from "@/types";

const protocolsSchema = z.array(
  z.object({
    name: z.string(),
    chain: z.string().optional(),
    category: z.string().optional(),
    tvl: z.number().optional(),
    symbol: z.string().optional()
  })
);

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

const LLAMA_PROTOCOLS_BASE = process.env.NEXT_PUBLIC_LLAMA_PROTOCOLS_BASE ?? "https://api.llama.fi";
const LLAMA_YIELDS_BASE = process.env.NEXT_PUBLIC_DEFILLAMA_API_BASE ?? "https://yields.llama.fi";

const BTC_KEYWORDS = ["btc", "wbtc", "tbtc", "sbtc", "solvbtc"];
const ETH_KEYWORDS = ["eth", "weth", "steth", "reth", "cbeth"];

function matchesKeywords(symbol: string, keywords: string[]) {
  const normalized = symbol.toLowerCase();
  return keywords.some((word) => normalized.includes(word));
}

function inferAsset(symbol: string): "BTC" | "ETH" | "OTHER" {
  if (matchesKeywords(symbol, BTC_KEYWORDS)) return "BTC";
  if (matchesKeywords(symbol, ETH_KEYWORDS)) return "ETH";
  return "OTHER";
}

function inferCategory(category: string): "dex" | "lending" | "other" {
  const normalized = category.toLowerCase();
  if (normalized.includes("lending") || normalized.includes("cdp")) return "lending";
  if (normalized.includes("dex") || normalized.includes("amm") || normalized.includes("liquidity")) return "dex";
  return "other";
}

export async function fetchProtocolTVLUniverse(): Promise<TvlProtocolPoint[]> {
  const response = await fetch(`${LLAMA_PROTOCOLS_BASE}/protocols`, { next: { revalidate: 45 } });
  const json = await response.json();
  const parsed = protocolsSchema.parse(json);

  return parsed
    .filter((item) => item.tvl && item.symbol)
    .map((item) => {
      const symbol = item.symbol ?? "";
      return {
        protocol: item.name,
        chain: item.chain ?? "multi-chain",
        tvl: item.tvl ?? 0,
        category: inferCategory(item.category ?? "other"),
        asset: inferAsset(symbol)
      } satisfies TvlProtocolPoint;
    });
}

export async function fetchYieldOpportunities(): Promise<Opportunity[]> {
  const response = await fetch(`${LLAMA_YIELDS_BASE}/pools`, { next: { revalidate: 45 } });
  const json = await response.json();
  const parsed = poolsSchema.parse(json);

  return parsed.data
    .filter((pool) => inferAsset(pool.symbol) !== "OTHER")
    .map((pool) => {
      const apy = pool.apy ?? pool.apyBase ?? 0;
      const volume = pool.volumeUsd1d ?? 0;
      const fees = Math.max(0, volume * 0.0025);
      const ilEstimate = Math.min(9.9, Math.max(0.2, apy * 0.08));
      const lvrEstimate = Math.min(6, Math.max(0.1, apy * 0.05));
      const score = apy * 0.5 + Math.log10((pool.tvlUsd ?? 1) + 1) * 8 + Math.log10(volume + 1) * 4 - ilEstimate - lvrEstimate;

      return {
        id: pool.pool,
        chain: pool.chain,
        protocol: pool.project,
        type: pool.project.toLowerCase().includes("aave") || pool.project.toLowerCase().includes("morpho") || pool.project.toLowerCase().includes("kamino") ? "Lending" : "LP",
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

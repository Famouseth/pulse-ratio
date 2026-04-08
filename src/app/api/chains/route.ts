import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.array(
  z.object({
    name: z.string(),
    tvl: z.number(),
    gecko_id: z.string().nullable().optional(),
    tokenSymbol: z.string().nullable().optional(),
    change_1d: z.number().nullable().optional(),
    change_7d: z.number().nullable().optional()
  })
);

// Server-side only — env var has no NEXT_PUBLIC_ prefix
const LLAMA_BASE = process.env.LLAMA_PROTOCOLS_BASE ?? "https://api.llama.fi";

export const revalidate = 3600; // 1 hour cache at edge

export async function GET() {
  try {
    const res = await fetch(`${LLAMA_BASE}/v2/chains`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });

    const json = await res.json();
    const parsed = schema.parse(json);

    const filtered = parsed
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

    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" }
    });
  } catch {
    return NextResponse.json({ error: "chain TVL fetch failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

const LLAMA_BASE = process.env.LLAMA_PROTOCOLS_BASE ?? "https://api.llama.fi";

export const revalidate = 900; // 15 min

export async function GET() {
  try {
    const [dexRes, feesRes] = await Promise.allSettled([
      fetch(`${LLAMA_BASE}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`, {
        next: { revalidate: 900 }
      }),
      fetch(`${LLAMA_BASE}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`, {
        next: { revalidate: 900 }
      })
    ]);

    const dexJson: Record<string, unknown> =
      dexRes.status === "fulfilled" && dexRes.value.ok ? await dexRes.value.json() : {};
    const feesJson: Record<string, unknown> =
      feesRes.status === "fulfilled" && feesRes.value.ok ? await feesRes.value.json() : {};

    const topDexes = (
      Array.isArray(dexJson.protocols)
        ? (dexJson.protocols as Array<Record<string, unknown>>)
        : []
    )
      .filter((p) => Number(p.total24h ?? 0) > 0)
      .sort((a, b) => Number(b.total24h ?? 0) - Number(a.total24h ?? 0))
      .slice(0, 8)
      .map((p) => ({
        name: String(p.displayName ?? p.name ?? "Unknown"),
        volume24h: Number(p.total24h ?? 0)
      }));

    return NextResponse.json({
      dexVolume24h: Number(dexJson.total24h ?? 0),
      dexVolume7d: Number(dexJson.total7d ?? 0),
      fees24h: Number(feesJson.total24h ?? 0),
      fees7d: Number(feesJson.total7d ?? 0),
      topDexes
    }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" }
    });
  } catch {
    return NextResponse.json({ error: "defi overview fetch failed" }, { status: 500 });
  }
}

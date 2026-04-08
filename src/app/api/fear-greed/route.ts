import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  data: z.array(
    z.object({
      value: z.string(),
      value_classification: z.string(),
      timestamp: z.string()
    })
  )
});

export const revalidate = 3600; // 1 hour — index only updates once per day

export async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });

    const json = await res.json();
    const parsed = schema.parse(json);
    const entry = parsed.data[0];

    const value = Number(entry.value);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: "invalid value" }, { status: 502 });
    }

    return NextResponse.json({
      value,
      classification: entry.value_classification,
      timestamp: Number(entry.timestamp) * 1000
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" }
    });
  } catch {
    return NextResponse.json({ error: "fear greed fetch failed" }, { status: 500 });
  }
}

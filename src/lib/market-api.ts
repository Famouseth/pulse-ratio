import { z } from "zod";
import type { MarketSnapshot } from "@/types";

const coingeckoSchema = z.object({
  bitcoin: z.object({
    usd: z.number(),
    usd_24h_change: z.number(),
    usd_market_cap: z.number(),
    usd_24h_vol: z.number()
  }),
  ethereum: z.object({
    usd: z.number(),
    usd_24h_change: z.number(),
    usd_market_cap: z.number(),
    usd_24h_vol: z.number()
  })
});

const GLOBAL_CAP = 2_500_000_000_000;
const COINGECKO_BASE = process.env.NEXT_PUBLIC_COINGECKO_BASE ?? "https://api.coingecko.com/api/v3";

export async function fetchCoinGeckoMarket(): Promise<Record<"BTC" | "ETH", MarketSnapshot>> {
  const url = `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
  const response = await fetch(url, { next: { revalidate: 12 } });
  const json = await response.json();
  const parsed = coingeckoSchema.parse(json);

  const btc = parsed.bitcoin;
  const eth = parsed.ethereum;

  return {
    BTC: {
      symbol: "BTC",
      price: btc.usd,
      marketCap: btc.usd_market_cap,
      volume24h: btc.usd_24h_vol,
      dominance: (btc.usd_market_cap / GLOBAL_CAP) * 100,
      change24h: btc.usd_24h_change,
      sparkline: []
    },
    ETH: {
      symbol: "ETH",
      price: eth.usd,
      marketCap: eth.usd_market_cap,
      volume24h: eth.usd_24h_vol,
      dominance: (eth.usd_market_cap / GLOBAL_CAP) * 100,
      change24h: eth.usd_24h_change,
      sparkline: []
    }
  };
}

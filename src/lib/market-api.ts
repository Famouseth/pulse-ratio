import { z } from "zod";
import type { GlobalMarket, MarketSnapshot, SparklineData } from "@/types";

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

const globalSchema = z.object({
  data: z.object({
    active_cryptocurrencies: z.number(),
    total_market_cap: z.object({ usd: z.number() }),
    total_volume: z.object({ usd: z.number() }),
    market_cap_percentage: z.object({ btc: z.number(), eth: z.number() }),
    market_cap_change_percentage_24h_usd: z.number()
  })
});

const marketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()]))
});

const GLOBAL_CAP = 2_500_000_000_000;
const COINGECKO_BASE = process.env.NEXT_PUBLIC_COINGECKO_BASE ?? "https://api.coingecko.com/api/v3";

export async function fetchCoinGeckoMarket(): Promise<Record<"BTC" | "ETH", MarketSnapshot>> {
  const url = `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
  const response = await fetch(url, { next: { revalidate: 12 } });
  if (!response.ok) throw new Error("CoinGecko price API error");
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

export async function fetchGlobalMarket(): Promise<GlobalMarket> {
  const url = `${COINGECKO_BASE}/global`;
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("CoinGecko global API error");
  const json = await response.json();
  const parsed = globalSchema.parse(json);
  const d = parsed.data;

  return {
    totalMarketCap: d.total_market_cap.usd,
    total24hVolume: d.total_volume.usd,
    btcDominance: d.market_cap_percentage.btc,
    ethDominance: d.market_cap_percentage.eth,
    change24h: d.market_cap_change_percentage_24h_usd,
    activeCryptos: d.active_cryptocurrencies
  };
}

export async function fetchSparklines(): Promise<SparklineData> {
  const [btcRes, ethRes] = await Promise.all([
    fetch(`${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily`),
    fetch(`${COINGECKO_BASE}/coins/ethereum/market_chart?vs_currency=usd&days=7&interval=daily`)
  ]);
  if (!btcRes.ok || !ethRes.ok) throw new Error("CoinGecko sparkline error");

  const [btcJson, ethJson] = await Promise.all([btcRes.json(), ethRes.json()]);
  const btcData = marketChartSchema.parse(btcJson);
  const ethData = marketChartSchema.parse(ethJson);

  const length = Math.min(btcData.prices.length, ethData.prices.length);
  return {
    timestamps: btcData.prices.slice(0, length).map(([ts]) => ts),
    btcPrices: btcData.prices.slice(0, length).map(([, p]) => p),
    ethPrices: ethData.prices.slice(0, length).map(([, p]) => p)
  };
}

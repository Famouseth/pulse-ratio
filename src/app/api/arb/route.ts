import { NextResponse } from "next/server";

export const revalidate = 30; // 30s — prices and funding change frequently

const BINANCE_SPOT = "https://api.binance.com/api/v3";
const BINANCE_FAPI = "https://fapi.binance.com/fapi/v1";
const LLAMA_YIELDS = process.env.LLAMA_YIELDS_BASE ?? "https://yields.llama.fi";

async function safeFetch(url: string, timeout = 5000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 30 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  try {
    // Fetch spot ticker, perp premium index, and DeFi yields in parallel
    const [spotTickers, btcPremium, ethPremium, yieldsRaw] = await Promise.all([
      safeFetch(`${BINANCE_SPOT}/ticker/24hr?symbols=%5B%22BTCUSDT%22%2C%22ETHUSDT%22%5D`),
      safeFetch(`${BINANCE_FAPI}/premiumIndex?symbol=BTCUSDT`),
      safeFetch(`${BINANCE_FAPI}/premiumIndex?symbol=ETHUSDT`),
      safeFetch(`${LLAMA_YIELDS}/pools`, 8000)
    ]);

    // --- Spot prices ---
    const spotMap: Record<string, { price: number; change24h: number; volume: number }> = {};
    if (Array.isArray(spotTickers)) {
      for (const t of spotTickers as Record<string, unknown>[]) {
        const sym = String(t.symbol ?? "");
        spotMap[sym] = {
          price: parseFloat(String(t.lastPrice ?? "0")),
          change24h: parseFloat(String(t.priceChangePercent ?? "0")),
          volume: parseFloat(String(t.quoteVolume ?? "0"))
        };
      }
    }

    // --- Perp funding ---
    function parsePremium(raw: unknown) {
      const r = raw as Record<string, unknown> | null;
      if (!r) return null;
      const markPrice = parseFloat(String(r.markPrice ?? "0"));
      const indexPrice = parseFloat(String(r.indexPrice ?? "0"));
      const fundingRate = parseFloat(String(r.lastFundingRate ?? "0"));
      const nextFundingTime = Number(r.nextFundingTime ?? 0);
      const basis = indexPrice > 0 ? ((markPrice - indexPrice) / indexPrice) * 100 : 0;
      const annualizedFunding = fundingRate * 3 * 365 * 100; // 3 funding events/day
      return { markPrice, indexPrice, fundingRate: fundingRate * 100, annualizedFunding, basis, nextFundingTime };
    }

    const btcPerp = parsePremium(btcPremium);
    const ethPerp = parsePremium(ethPremium);

    // --- Best DeFi rates for BTC/ETH ---
    const BTC_KW = ["btc", "wbtc", "tbtc", "solvbtc"];
    const ETH_KW = ["eth", "weth", "steth", "reth", "cbeth"];

    const bestBtcRates: { protocol: string; chain: string; symbol: string; apy: number; tvlUsd: number }[] = [];
    const bestEthRates: { protocol: string; chain: string; symbol: string; apy: number; tvlUsd: number }[] = [];

    if (yieldsRaw && Array.isArray((yieldsRaw as Record<string, unknown>).data)) {
      const pools = (yieldsRaw as { data: Record<string, unknown>[] }).data;
      for (const p of pools) {
        const sym = String(p.symbol ?? "").toLowerCase();
        const apy = typeof p.apy === "number" ? p.apy : typeof p.apyBase === "number" ? (p.apyBase as number) : 0;
        const tvl = typeof p.tvlUsd === "number" ? p.tvlUsd : 0;
        if (apy < 0.1 || tvl < 100_000) continue;

        const isBtc = BTC_KW.some((k) => sym.includes(k));
        const isEth = ETH_KW.some((k) => sym.includes(k));
        if (!isBtc && !isEth) continue;

        const entry = {
          protocol: String(p.project ?? ""),
          chain: String(p.chain ?? ""),
          symbol: String(p.symbol ?? ""),
          apy,
          tvlUsd: tvl
        };
        if (isBtc) bestBtcRates.push(entry);
        if (isEth) bestEthRates.push(entry);
      }
    }

    bestBtcRates.sort((a, b) => b.apy - a.apy);
    bestEthRates.sort((a, b) => b.apy - a.apy);

    // --- Carry trade opportunities (funding vs lending) ---
    const carries: {
      asset: string;
      strategy: string;
      description: string;
      annualYield: number;
      type: "funding" | "basis" | "defi";
    }[] = [];

    if (btcPerp) {
      carries.push({
        asset: "BTC",
        strategy: "Funding Rate Carry",
        description: `Long BTC spot, short BTC perp. Collect ${btcPerp.fundingRate.toFixed(4)}% / 8h funding.`,
        annualYield: btcPerp.annualizedFunding,
        type: "funding"
      });
      if (Math.abs(btcPerp.basis) > 0.05) {
        carries.push({
          asset: "BTC",
          strategy: "Basis Trade",
          description: `Perp trades at ${btcPerp.basis > 0 ? "+" : ""}${btcPerp.basis.toFixed(3)}% vs index. ${btcPerp.basis > 0 ? "Long spot / Short perp" : "Short spot / Long perp"}.`,
          annualYield: Math.abs(btcPerp.basis) * 12,
          type: "basis"
        });
      }
    }

    if (ethPerp) {
      carries.push({
        asset: "ETH",
        strategy: "Funding Rate Carry",
        description: `Long ETH spot, short ETH perp. Collect ${ethPerp.fundingRate.toFixed(4)}% / 8h funding.`,
        annualYield: ethPerp.annualizedFunding,
        type: "funding"
      });
    }

    // Add top DeFi vs funding rate arb
    const btcTop = bestBtcRates[0];
    const ethTop = bestEthRates[0];
    if (btcTop && btcPerp) {
      const spread = btcTop.apy - btcPerp.annualizedFunding;
      if (Math.abs(spread) > 1) {
        carries.push({
          asset: "BTC",
          strategy: "DeFi vs Perp Rate Arb",
          description: `${btcTop.protocol} ${btcTop.symbol} lend ${btcTop.apy.toFixed(2)}% APY vs ${btcPerp.annualizedFunding.toFixed(2)}% perp funding. ${spread > 0 ? "DeFi pays more — borrow on perp to lend on chain." : "Hedge: lend spot & cover with perp."}`,
          annualYield: Math.abs(spread),
          type: "defi"
        });
      }
    }

    carries.sort((a, b) => Math.abs(b.annualYield) - Math.abs(a.annualYield));

    return NextResponse.json({
      spot: {
        btc: spotMap["BTCUSDT"] ?? null,
        eth: spotMap["ETHUSDT"] ?? null
      },
      perp: {
        btc: btcPerp,
        eth: ethPerp
      },
      bestBtcRates: bestBtcRates.slice(0, 8),
      bestEthRates: bestEthRates.slice(0, 8),
      carries
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" }
    });
  } catch {
    return NextResponse.json({ error: "arb data fetch failed" }, { status: 500 });
  }
}

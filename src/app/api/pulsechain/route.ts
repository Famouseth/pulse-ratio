import { NextResponse } from "next/server";

// PulseChain RPCs (chainId 369) — primary first, fallbacks from chainlist.org
const PLS_RPCS = [
  "https://rpc.pulsechain.box",
  "https://rpc.pulsechain.com",
  "https://pulsechain.publicnode.com",
  "https://rpc-pulsechain.g4mm4.io",
];

const LLAMA_BASE = process.env.LLAMA_PROTOCOLS_BASE ?? "https://api.llama.fi";
const LLAMA_BRIDGES = "https://bridges.llama.fi";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex";

// Wrapped PLS address on PulseChain
const WPLS = "pulsechain:0xA1077a294dDE1B09bB078844df40758a5D0f9a27";
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27";

async function getLatestBlock(): Promise<string | null> {
  for (const rpc of PLS_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { result?: string };
      if (data?.result) return data.result;
    } catch {
      // try next RPC
    }
  }
  return null;
}

export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const [chainsRes, cgRes, dexRes, bridgesRes, blockHex] = await Promise.allSettled([
      fetch(`${LLAMA_BASE}/v2/chains`, { next: { revalidate: 3600 } }),
      fetch(`${COINGECKO_BASE}/simple/price?ids=pulsechain&vs_currencies=usd`, { next: { revalidate: 300 } }),
      fetch(`${DEXSCREENER_BASE}/tokens/${WPLS_ADDRESS}`, { next: { revalidate: 120 } }),
      fetch(`${LLAMA_BRIDGES}/bridges`, { next: { revalidate: 3600 } }),
      getLatestBlock(),
    ]);

    // PulseChain TVL from DefiLlama chains
    let plsTvl = 0;
    let plsChange1d = 0;
    let plsChange7d = 0;
    if (chainsRes.status === "fulfilled" && chainsRes.value.ok) {
      const chains = (await chainsRes.value.json()) as Array<{
        name: string; tvl: number; change_1d?: number | null; change_7d?: number | null;
      }>;
      const pulse = chains.find((c) => c.name.toLowerCase().includes("pulse"));
      if (pulse) {
        plsTvl = pulse.tvl ?? 0;
        plsChange1d = pulse.change_1d ?? 0;
        plsChange7d = pulse.change_7d ?? 0;
      }
    }

    // PLS price: CoinGecko primary, DexScreener fallback
    let plsPrice = 0;
    if (cgRes.status === "fulfilled" && cgRes.value.ok) {
      const cg = (await cgRes.value.json()) as { pulsechain?: { usd?: number } };
      plsPrice = cg.pulsechain?.usd ?? 0;
    }
    if (plsPrice <= 0 && dexRes.status === "fulfilled" && dexRes.value.ok) {
      const dex = (await dexRes.value.json()) as {
        pairs?: Array<{ chainId?: string; priceUsd?: string }>;
      };
      const pulsePair = dex.pairs?.find((p) => p.chainId?.toLowerCase() === "pulsechain" && p.priceUsd);
      if (pulsePair?.priceUsd) plsPrice = Number.parseFloat(pulsePair.priceUsd) || 0;
    }

    // Bridge stats from DefiLlama (paid endpoint may return no data)
    let bridgeName = "PulseChain OmniBridge";
    let bridge24hVolume: number | null = null;
    if (bridgesRes.status === "fulfilled" && bridgesRes.value.ok) {
      const bdData = (await bridgesRes.value.json()) as {
        bridges?: Array<{
          displayName: string;
          chains?: string[];
          currentDayVolume?: number;
          lastDayVolume?: number;
          dailyVolume?: number;
        }>;
      };
      const plsBridge = bdData.bridges?.find(
        (b) =>
          b.displayName?.toLowerCase().includes("pulse") ||
          b.chains?.some((c) => c.toLowerCase().includes("pulse"))
      );
      if (plsBridge) {
        bridgeName = plsBridge.displayName ?? bridgeName;
        bridge24hVolume = plsBridge.currentDayVolume ?? plsBridge.lastDayVolume ?? plsBridge.dailyVolume ?? null;
      }
    }

    // Latest block from RPC
    const blockHexVal = blockHex.status === "fulfilled" ? blockHex.value : null;
    const latestBlock = blockHexVal ? parseInt(blockHexVal, 16) : null;

    return NextResponse.json(
      {
        plsTvl,
        plsChange1d,
        plsChange7d,
        plsPrice,
        latestBlock,
        bridgeName,
        bridge24hVolume,
        // OmniBridge contract addresses from docs.pulsechain.com
        bridgeContracts: {
          ethOmniBridge: "0x1715a3E4A142d8b698131108995174F37aEBA10D",
          ethAmb: "0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64",
          plsOmniBridge: "0x1715a3E4A142d8b698131108995174F37aEBA10D",
          plsAmb: "0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64",
        },
        bridgeUrl: "https://bridge.pulsechain.com",
        explorerUrl: "https://scan.pulsechain.com",
        pulsexUrl: "https://app.pulsex.com",
        docsUrl: "https://docs.pulsechain.com",
        rpcs: PLS_RPCS,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ error: "PulseChain data fetch failed" }, { status: 500 });
  }
}

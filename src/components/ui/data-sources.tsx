"use client";

import { ExternalLink } from "lucide-react";

const CATALOGUE = {
  defillama:        { label: "DefiLlama",          href: "https://defillama.com",                                      color: "#2172e5" },
  defillamaChains:  { label: "DefiLlama Chains",   href: "https://defillama.com/chains",                               color: "#2172e5" },
  defillamaYields:  { label: "DefiLlama Yields",   href: "https://defillama.com/yields",                               color: "#2172e5" },
  defillamaDex:     { label: "DefiLlama DEX",      href: "https://defillama.com/dexs",                                 color: "#2172e5" },
  defillamaFees:    { label: "DefiLlama Fees",     href: "https://defillama.com/fees",                                 color: "#2172e5" },
  coingecko:        { label: "CoinGecko",           href: "https://www.coingecko.com",                                  color: "#8dc63f" },
  binance:          { label: "Binance Spot",        href: "https://www.binance.com/en/trade/BTC_USDT",                  color: "#F0B90B" },
  binancePerp:      { label: "Binance Futures",     href: "https://www.binance.com/en/futures/BTCUSDT",                 color: "#F0B90B" },
  feargreed:        { label: "Fear & Greed",        href: "https://alternative.me/crypto/fear-and-greed-index/",        color: "#ef4444" },
  aave:             { label: "Aave",                href: "https://app.aave.com",                                       color: "#B6509E" },
  uniswap:          { label: "Uniswap",             href: "https://app.uniswap.org",                                    color: "#FF007A" },
  coinglass:        { label: "Coinglass",           href: "https://www.coinglass.com",                                  color: "#00c3ff" },
  tradingview:      { label: "TradingView",         href: "https://www.tradingview.com/chart/?symbol=BINANCE:ETHBTC",   color: "#2962ff" },
  dune:             { label: "Dune Analytics",      href: "https://dune.com/browse/dashboards?q=btc+eth",               color: "#e67bf0" },
  tokenterminal:    { label: "Token Terminal",      href: "https://tokenterminal.com/terminal/markets/ethereum",        color: "#a78bfa" },
  etherscan:        { label: "Etherscan",           href: "https://etherscan.io",                                       color: "#3498db" },
  solscan:          { label: "Solscan",             href: "https://solscan.io",                                         color: "#9945ff" },
  nansen:           { label: "Nansen",              href: "https://app.nansen.ai",                                      color: "#f97316" },
  coinmarketcap:    { label: "CoinMarketCap",       href: "https://coinmarketcap.com",                                  color: "#3861fb" },
  messari:          { label: "Messari",             href: "https://messari.io/asset/bitcoin",                           color: "#06d6a0" },
  pulsechain:       { label: "PulseChain",          href: "https://pulsechain.com",                                     color: "#9333ea" },
  pulsex:           { label: "PulseX",              href: "https://app.pulsex.com",                                     color: "#9333ea" },
  omnibridge:       { label: "OmniBridge",          href: "https://bridge.pulsechain.com",                              color: "#7c3aed" },
  pulsescan:        { label: "PulseScan",           href: "https://scan.pulsechain.com",                                color: "#8b5cf6" },
} as const;

export type SourceKey = keyof typeof CATALOGUE;

interface DataSourcesProps {
  sources: SourceKey[];
  label?: string;
}

export function DataSources({ sources, label = "Data:" }: DataSourcesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {sources.map((key) => {
        const s = CATALOGUE[key];
        return (
          <a
            key={key}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium transition-opacity hover:opacity-80"
            style={{
              borderColor: s.color + "55",
              color: s.color,
              background: s.color + "15"
            }}
          >
            {s.label}
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        );
      })}
    </div>
  );
}

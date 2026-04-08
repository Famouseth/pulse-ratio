export type ChainScope = "all" | "evm" | "solana";

export interface MarketSnapshot {
  symbol: "BTC" | "ETH";
  price: number;
  marketCap: number;
  volume24h: number;
  dominance: number;
  change24h: number;
  sparkline: number[];
}

export interface RatioPoint {
  timestamp: number;
  ratio: number;
}

export interface TvlProtocolPoint {
  protocol: string;
  chain: string;
  tvl: number;
  category: "dex" | "lending" | "other";
  asset: "BTC" | "ETH" | "OTHER";
}

export interface TvlTotals {
  btcLending: number;
  btcLp: number;
  ethLending: number;
  ethLp: number;
  btcTotal: number;
  ethTotal: number;
  combined: number;
  ethChainTvl: number;    // real Ethereum chain TVL from DefiLlama /v2/chains
  totalDeFiTvl: number;   // sum of all chains
}

export interface ChainTvlItem {
  name: string;
  tvl: number;
  tokenSymbol: string;
  change1d: number;
  change7d: number;
}

export interface GlobalMarket {
  totalMarketCap: number;
  total24hVolume: number;
  btcDominance: number;
  ethDominance: number;
  change24h: number;
  activeCryptos: number;
}

export interface SparklineData {
  btcPrices: number[];
  ethPrices: number[];
  timestamps: number[];
}

export interface DeFiOverview {
  dexVolume24h: number;
  dexVolume7d: number;
  fees24h: number;
  fees7d: number;
  topDexes: Array<{ name: string; volume24h: number }>;
}

export interface Opportunity {
  id: string;
  chain: string;
  protocol: string;
  type: "LP" | "Lending";
  symbol: string;
  tvlUsd: number;
  apy: number;
  volume24h: number;
  fees24h: number;
  ilEstimate: number;
  lvrEstimate: number;
  score: number;
}

export interface BondingProjection {
  rewardTokenAmount: number;
  roiPct: number;
  projectedApy: number;
  breakEvenDays: number;
  projectedValue: number;
}

export interface WalletToken {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  logo: string | null;
  mint?: string; // Solana mint address
}

export interface WalletSnapshot {
  nativeBalance: number;
  nativeSymbol: string;
  nativeUsd: number;
  tokens: WalletToken[];
  txCount: number;
  fetchedAt: number;
}

export interface WalletEntry {
  address: string;
  chain: "evm" | "solana";
  label?: string;
  viewedAt: number;
  snapshot?: WalletSnapshot;
}

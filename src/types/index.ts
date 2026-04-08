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

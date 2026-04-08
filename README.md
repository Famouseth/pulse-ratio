# PulseRatio - BTC vs ETH Real-Time TVL & LP Bonding Dashboard

PulseRatio is a production-oriented Next.js 15 App Router dashboard for liquidity providers, traders, and DeFi analysts focused on BTC vs ETH capital flows, LP/lending yields, bonding opportunities, and cross-market edges.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives + lucide-react
- Recharts + TradingView Lightweight Charts
- TanStack Query v5 polling architecture
- Wagmi + viem + RainbowKit (EVM wallets)
- Solana wallet adapter + @solana/web3.js (Phantom/Solflare)
- Zustand global state
- Zod validation for API payloads
- Framer Motion animations
- @tanstack/react-table for opportunities table
- Vercel deployment-ready

## Quick Start

1. Install dependencies:
   npm install

2. Create environment file:
   copy .env.example .env.local

3. Set values in .env.local:
   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   - NEXT_PUBLIC_DEFAULT_EVM_CHAIN
   - NEXT_PUBLIC_DEFILLAMA_API_BASE
   - NEXT_PUBLIC_LLAMA_PROTOCOLS_BASE
   - NEXT_PUBLIC_COINGECKO_BASE

4. Run dev server:
   npm run dev

5. Open:
   http://localhost:3000

## Architecture

- src/app
  - Dashboard, TVL Analytics, Opportunities, Bonding, Charts, Arb, Portfolio, Stats
- src/components
  - layout: sidebar + top bar
  - dashboard: metric cards, table, TVL chart, bonding calculator
  - charts: TradingView Lightweight chart wrapper
  - ui: shadcn-style reusable primitives
- src/hooks
  - use-market-data: CoinGecko + Binance websocket merge
  - use-tvl-data: DefiLlama protocol TVL polling + chain scoping
  - use-opportunities: DefiLlama yields polling + chain scoping
  - use-toast-alerts: high-value conditions
- src/lib
  - defillama-api.ts, tvl-utils.ts, bonding-utils.ts, evm-utils.ts, solana-utils.ts
- src/store
  - Zustand global chain scope and ratio history

## Data Sources and Polling

- CoinGecko REST: every 10s
- Binance WebSocket: real-time tick updates
- DefiLlama protocols endpoint: every 45s
- DefiLlama pools endpoint: every 60s

## Rate Limit Handling

- Uses TanStack Query stale windows and interval polling to avoid excessive requests.
- Keep default intervals unless you deploy your own data proxy.
- If using Vercel edge/serverless fetches at scale, consider:
  - endpoint-level cache
  - request coalescing
  - a lightweight backend cache layer

## Extending TVL Filters

Update keywords in src/lib/defillama-api.ts:
- BTC_KEYWORDS
- ETH_KEYWORDS

To include additional wrapped/synthetic assets, append normalized symbols to those arrays.

## Extending Bonding Protocol Coverage

- Add protocol-specific ingestion/adapters in src/lib/defillama-api.ts and src/lib/bonding-utils.ts
- Expand scoring model:
  - include lock duration risk
  - reward token volatility
  - liquidity depth/exit slippage

## Wallet Position Tracking

Current implementation provides connection scaffolding for EVM and Solana.
For full position accounting:
- Extend src/lib/evm-utils.ts with on-chain multicalls per protocol
- Extend src/lib/solana-utils.ts with account parsing for Kamino/Marginfi/Drift/Raydium/Orca

## Deployment (Vercel)

1. Push repository.
2. Import into Vercel.
3. Configure .env variables in project settings.
4. Deploy.

## Notes

- Public APIs may change response schema; Zod validation ensures fast failure and typed handling.
- Replace placeholder assumptions in IL/LVR scoring with protocol-level models as needed.

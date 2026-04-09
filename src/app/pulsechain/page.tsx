"use client";

import { useMemo } from "react";
import { ExternalLink, Copy, Activity, Zap, ArrowLeftRight, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataSources } from "@/components/ui/data-sources";
import { usePulsechain } from "@/hooks/use-pulsechain";
import { useOpportunities } from "@/hooks/use-opportunities";
import { formatUsd } from "@/lib/utils";

const PLS_COLOR = "#9333ea";
const PLS_COLOR_DIM = "rgba(147,51,234,0.15)";
const PLS_BORDER = "rgba(147,51,234,0.3)";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function StatCard({
  label,
  value,
  sub,
  delta,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  loading?: boolean;
}) {
  return (
    <Card style={{ borderColor: PLS_BORDER, background: PLS_COLOR_DIM }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded bg-white/5" />
        ) : (
          <>
            <p className="text-2xl font-semibold" style={{ color: PLS_COLOR }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {delta !== undefined && (
              <span className={`text-xs ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {delta >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {" "}{Math.abs(delta).toFixed(2)}% 24h
              </span>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ContractRow({ label, address, explorer }: { label: string; address: string; explorer: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-white/70 truncate min-w-0">{address}</span>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => copyToClipboard(address)}
          className="rounded p-1 hover:bg-white/10 transition-colors"
          title="Copy"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-1 hover:bg-white/10 transition-colors"
          title="View in explorer"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}

export default function PulseChainPage() {
  const { data, isLoading } = usePulsechain();
  const { data: allPools, isLoading: poolsLoading } = useOpportunities();

  // Filter pools to Pulse chain
  const pulsePools = useMemo(
    () => (allPools ?? []).filter((p) => p.chain.toLowerCase() === "pulse").sort((a, b) => b.score - a.score).slice(0, 15),
    [allPools]
  );

  const blockStr = data?.latestBlock ? data.latestBlock.toLocaleString() : "—";
  const plsPriceStr = data && Number.isFinite(data.plsPrice) && data.plsPrice > 0 ? `$${data.plsPrice.toFixed(6)}` : "N/A";
  const plsTvlStr = data && Number.isFinite(data.plsTvl) && data.plsTvl >= 0 ? formatUsd(data.plsTvl, 2) : "N/A";
  const bridgeVolStr = data?.bridge24hVolume !== null && data?.bridge24hVolume !== undefined
    ? formatUsd(data.bridge24hVolume, 2)
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: PLS_COLOR_DIM, border: `1px solid ${PLS_BORDER}` }}
          >
            {/* PulseChain hex icon */}
            <svg viewBox="0 0 24 24" width="20" height="20" fill={PLS_COLOR}>
              <path d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2ZM12 4.24L18 7.62V16.38L12 19.76L6 16.38V7.62L12 4.24Z" />
              <circle cx="12" cy="12" r="3" fill={PLS_COLOR} />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">PulseChain Stats</h1>
            <DataSources sources={["pulsechain", "pulsex", "omnibridge", "pulsescan", "defillama"]} />
          </div>
          {isLoading && <Badge className="animate-pulse text-xs">Loading...</Badge>}
          {data?.latestBlock && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400" />
              Block #{blockStr}
            </span>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="PLS Price"
          value={plsPriceStr}
          sub="Wrapped PLS · DefiLlama"
          loading={isLoading}
        />
        <StatCard
          label="PulseChain TVL"
          value={plsTvlStr}
          sub="All DeFi on Pulse chain"
          delta={data?.plsChange1d}
          loading={isLoading}
        />
        <StatCard
          label="7d TVL Change"
          value={data?.plsChange7d !== undefined ? `${data.plsChange7d >= 0 ? "+" : ""}${data.plsChange7d.toFixed(2)}%` : "—"}
          sub="DefiLlama chain TVL"
          loading={isLoading}
        />
        <StatCard
          label="OmniBridge 24h Vol"
          value={bridgeVolStr}
          sub={data?.bridgeName ?? "PulseChain Bridge"}
          loading={isLoading}
        />
      </section>

      {/* OmniBridge section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" style={{ color: PLS_COLOR }} />
              OmniBridge — Ethereum ↔ PulseChain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The PulseChain OmniBridge allows trustless transfer of ERC-20 tokens (ETH, WBTC, USDC, etc.) 
              between Ethereum mainnet and PulseChain. Uses the AMB (Arbitrary Message Bridge) architecture.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Bridge App", href: data?.bridgeUrl ?? "https://bridge.pulsechain.com", icon: ArrowLeftRight },
                { label: "Explorer", href: data?.explorerUrl ?? "https://scan.pulsechain.com", icon: Activity },
                { label: "PulseX DEX", href: data?.pulsexUrl ?? "https://app.pulsex.com", icon: Zap },
                { label: "Docs", href: data?.docsUrl ?? "https://docs.pulsechain.com", icon: ExternalLink },
              ].map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: PLS_BORDER, color: PLS_COLOR }}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </a>
              ))}
            </div>

            {/* RPCs */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">RPC Endpoints</p>
              <div className="space-y-1">
                {(data?.rpcs ?? ["https://rpc.pulsechain.box", "https://rpc.pulsechain.com", "https://pulsechain.publicnode.com"]).map((rpc) => (
                  <div key={rpc} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-1.5 text-xs">
                    <span className="font-mono text-white/60">{rpc}</span>
                    <button
                      onClick={() => copyToClipboard(rpc)}
                      className="rounded p-1 hover:bg-white/10 transition-colors ml-2 shrink-0"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bridge contract addresses */}
        <Card className="border-white/5 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: PLS_COLOR }} />
              Bridge Contract Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              From{" "}
              <a href="https://docs.pulsechain.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: PLS_COLOR }}>
                docs.pulsechain.com
              </a>
            </p>
            {data?.bridgeContracts && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Ethereum Side</p>
                <ContractRow
                  label="OmniBridge"
                  address={data.bridgeContracts.ethOmniBridge}
                  explorer="https://etherscan.io"
                />
                <ContractRow
                  label="AMB"
                  address={data.bridgeContracts.ethAmb}
                  explorer="https://etherscan.io"
                />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">PulseChain Side</p>
                <ContractRow
                  label="OmniBridge"
                  address={data.bridgeContracts.plsOmniBridge}
                  explorer={data.explorerUrl}
                />
                <ContractRow
                  label="AMB"
                  address={data.bridgeContracts.plsAmb}
                  explorer={data.explorerUrl}
                />
              </div>
            )}
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PulseChain BTC/ETH Pools */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: PLS_COLOR }} />
              BTC / ETH Pools on PulseChain
            </span>
            {!poolsLoading && (
              <span className="text-xs font-normal text-muted-foreground">
                {pulsePools.length} pools
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {poolsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : pulsePools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <span className="text-2xl">⚡</span>
              <p>No BTC/ETH pools on PulseChain meet the TVL threshold ($500k+).</p>
              <a
                href="https://app.pulsex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: PLS_COLOR }}
              >
                View PulseX pools →
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <tr>
                    <th className="px-4 py-2 text-left">Protocol</th>
                    <th className="px-4 py-2 text-left">Pair</th>
                    <th className="px-4 py-2 text-right">TVL</th>
                    <th className="px-4 py-2 text-right">APY</th>
                    <th className="px-4 py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pulsePools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{pool.protocol}</td>
                      <td className="px-4 py-2.5 text-white/70">{pool.symbol}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatUsd(pool.tvlUsd, 1)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">{pool.apy.toFixed(2)}%</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{pool.score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Image from "next/image";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils";
import type { LookupResult } from "@/hooks/use-wallet-lookup";

interface Props {
  result: LookupResult;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function explorerUrl(address: string, chain: "evm" | "solana") {
  return chain === "evm"
    ? `https://etherscan.io/address/${address}`
    : `https://solscan.io/account/${address}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy} className="ml-1 text-muted-foreground hover:text-foreground transition-colors" title="Copy address">
      {copied ? <Check className="h-3.5 w-3.5 text-cyber" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function WalletDisplay({ result }: Props) {
  const { address, chain, snapshot } = result;
  const totalUsd = snapshot.nativeUsd + snapshot.tokens.reduce((s, t) => s + t.usdValue, 0);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="border-white/10 bg-black/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={chain === "evm" ? "success" : "default"} className={chain === "solana" ? "bg-[#9B5BFF]/20 text-[#9B5BFF]" : ""}>
                  {chain === "evm" ? "EVM / Ethereum" : "Solana"}
                </Badge>
                {snapshot.txCount > 0 && (
                  <span className="text-xs text-muted-foreground">{snapshot.txCount.toLocaleString()} txns</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1 font-mono text-sm text-muted-foreground">
                <span className="hidden sm:inline">{address}</span>
                <span className="sm:hidden">{shortAddr(address)}</span>
                <CopyButton text={address} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Est. Value</p>
              <p className="text-2xl font-semibold text-foreground">{formatUsd(totalUsd)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <a
            href={explorerUrl(address, chain)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            View on {chain === "evm" ? "Etherscan" : "Solscan"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Native balance */}
      <Card className="border-white/10 bg-black/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Native Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-semibold ${chain === "evm" ? "text-eth" : "text-[#9B5BFF]"}`}>
              {snapshot.nativeBalance.toFixed(6)} {snapshot.nativeSymbol}
            </span>
            <span className="text-sm text-muted-foreground">{formatUsd(snapshot.nativeUsd)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Token list */}
      {snapshot.tokens.length > 0 ? (
        <Card className="border-white/10 bg-black/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Tokens ({snapshot.tokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {snapshot.tokens.map((token, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    {token.logo ? (
                      <Image
                        src={token.logo}
                        alt={token.symbol}
                        width={28}
                        height={28}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                    {token.usdValue > 0 && (
                      <p className="text-xs text-muted-foreground">{formatUsd(token.usdValue)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-black/30">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No token holdings found.
          </CardContent>
        </Card>
      )}

      <p className="text-right text-[11px] text-muted-foreground">
        Data fetched {new Date(snapshot.fetchedAt).toLocaleTimeString()} · EVM via Ethplorer · Solana via mainnet RPC
      </p>
    </div>
  );
}

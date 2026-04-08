"use client";

import { Clock, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/store/use-wallet-store";
import { formatUsd } from "@/lib/utils";

interface Props {
  onSelect: (address: string) => void;
}

function shortAddr(addr: string) {
  return addr.slice(0, 8) + "…" + addr.slice(-6);
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function WalletHistory({ onSelect }: Props) {
  const { viewedWallets, remove, clear, activeAddress } = useWalletStore();

  if (viewedWallets.length === 0) {
    return (
      <Card className="border-white/10 bg-black/30">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Clock className="mx-auto mb-2 h-7 w-7 opacity-30" />
          No wallets viewed yet. Paste an address above to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          History ({viewedWallets.length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={clear} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {viewedWallets.map((w) => {
            const isActive = w.address === activeAddress;
            const totalUsd = w.snapshot
              ? w.snapshot.nativeUsd + w.snapshot.tokens.reduce((s, t) => s + t.usdValue, 0)
              : null;

            return (
              <div
                key={w.address}
                className={`flex items-center gap-3 px-6 py-3 transition-colors hover:bg-white/5 cursor-pointer ${isActive ? "bg-primary/5" : ""}`}
                onClick={() => onSelect(w.address)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge
                      variant={w.chain === "evm" ? "success" : "default"}
                      className={`text-[10px] py-0 ${w.chain === "solana" ? "bg-[#9B5BFF]/20 text-[#9B5BFF]" : ""}`}
                    >
                      {w.chain === "evm" ? "EVM" : "SOL"}
                    </Badge>
                    {w.label && <span className="text-xs font-medium text-foreground truncate">{w.label}</span>}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{shortAddr(w.address)}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{timeAgo(w.viewedAt)}</p>
                </div>

                <div className="text-right shrink-0">
                  {totalUsd !== null && (
                    <p className="text-sm font-medium">{formatUsd(totalUsd)}</p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(w.address); }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Re-inspect"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(w.address); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={w.chain === "evm" ? `https://etherscan.io/address/${w.address}` : `https://solscan.io/account/${w.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Open in explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

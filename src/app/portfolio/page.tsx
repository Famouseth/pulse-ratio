"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { WalletSearchBar } from "@/components/wallet/wallet-search-bar";
import { WalletDisplay } from "@/components/wallet/wallet-display";
import { WalletHistory } from "@/components/wallet/wallet-history";
import { SessionKey } from "@/components/wallet/session-key";
import { DataSources } from "@/components/ui/data-sources";
import { useWalletLookup } from "@/hooks/use-wallet-lookup";
import { useWalletStore } from "@/store/use-wallet-store";

export default function WalletTrackerPage() {
  const { result, loading, error, lookup } = useWalletLookup();
  const { addOrUpdate, setActive } = useWalletStore();

  // Persist to history on each successful lookup
  useEffect(() => {
    if (!result) return;
    addOrUpdate({
      address: result.address,
      chain: result.chain,
      viewedAt: Date.now(),
      snapshot: result.snapshot
    });
    setActive(result.address);
  }, [result, addOrUpdate, setActive]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Wallet Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste any EVM or Solana address to inspect it — no wallet connection required.
        </p>
        <DataSources sources={["etherscan", "solscan", "nansen", "dune"]} />
      </div>

      {/* Search bar */}
      <WalletSearchBar loading={loading} onLookup={lookup} />

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main split layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet details — takes 2/3 on large screens */}
        <div className="lg:col-span-2">
          {result ? (
            <WalletDisplay result={result} />
          ) : (
            !error && (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground">
                Wallet details will appear here
              </div>
            )
          )}
        </div>

        {/* History + session key */}
        <div className="space-y-4">
          <WalletHistory onSelect={lookup} />
          <SessionKey />
        </div>
      </div>
    </div>
  );
}

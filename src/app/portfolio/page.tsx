"use client";

import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTvlData } from "@/hooks/use-tvl-data";

export default function PortfolioPage() {
  const evmAccount = useAccount();
  const solWallet = useWallet();
  const { totals } = useTvlData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Portfolio & Stats</h1>
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>EVM Wallet</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Address: {evmAccount.address ?? "Not connected"}</p>
            <p>Status: {evmAccount.isConnected ? "Connected" : "Disconnected"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Solana Wallet</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Address: {solWallet.publicKey?.toBase58() ?? "Not connected"}</p>
            <p>Status: {solWallet.connected ? "Connected" : "Disconnected"}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Aggregated BTC/ETH TVL Exposure</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Live BTC Core TVL: ${totals?.btcTotal.toFixed(2) ?? "0.00"}</p>
          <p>Live ETH Core TVL: ${totals?.ethTotal.toFixed(2) ?? "0.00"}</p>
          <p>Use protocol adapters in lib/evm-utils and lib/solana-utils to attach on-chain position queries.</p>
        </CardContent>
      </Card>
    </div>
  );
}

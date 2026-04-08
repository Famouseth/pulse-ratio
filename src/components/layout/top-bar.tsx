"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAppStore } from "@/store/use-app-store";
import { useMarketData } from "@/hooks/use-market-data";
import { useTvlData } from "@/hooks/use-tvl-data";
import { useToastAlerts } from "@/hooks/use-toast-alerts";
import { formatUsd } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopBar() {
  useToastAlerts();

  const { data } = useMarketData();
  const { totals } = useTvlData();
  const chainScope = useAppStore((s) => s.chainScope);
  const setChainScope = useAppStore((s) => s.setChainScope);

  const ratio = data ? data.BTC.price / data.ETH.price : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Badge variant="warning">BTC/ETH: {ratio.toFixed(3)}</Badge>
        <Badge variant="success">BTC TVL {totals ? formatUsd(totals.btcTotal, 1) : "-"}</Badge>
        <Badge>ETH TVL {totals ? formatUsd(totals.ethTotal, 1) : "-"}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant={chainScope === "all" ? "default" : "outline"} size="sm" onClick={() => setChainScope("all")}>All</Button>
          <Button variant={chainScope === "evm" ? "default" : "outline"} size="sm" onClick={() => setChainScope("evm")}>EVM</Button>
          <Button variant={chainScope === "solana" ? "default" : "outline"} size="sm" onClick={() => setChainScope("solana")}>Solana</Button>
          <ConnectButton chainStatus="icon" accountStatus="address" />
          <WalletMultiButton className="!h-10 !rounded-xl !bg-white/10 hover:!bg-white/20" />
        </div>
      </div>
    </header>
  );
}

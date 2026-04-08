"use client";

import { useState } from "react";
import { Key, Copy, Check, Upload, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/store/use-wallet-store";

export function SessionKey() {
  const { exportKey, importKey, viewedWallets } = useWalletStore();
  const [importValue, setImportValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "err">("idle");

  function handleExport() {
    const key = exportKey();
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImport() {
    const ok = importKey(importValue.trim());
    setImportStatus(ok ? "ok" : "err");
    if (ok) setImportValue("");
    setTimeout(() => setImportStatus("idle"), 3000);
  }

  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          <Key className="h-4 w-4" />
          Session Key — Save & Restore Your History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your wallet history lives in this browser. Export a <strong className="text-foreground">session key</strong> (an encoded string) to back it up or load it on another device.
        </p>

        {/* Export */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Export</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={viewedWallets.length === 0}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4 text-cyber" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied to clipboard!" : `Copy key (${viewedWallets.length} wallets)`}
          </Button>
        </div>

        {/* Import */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Import</p>
          <div className="flex gap-2">
            <Input
              value={importValue}
              onChange={(e) => { setImportValue(e.target.value); setImportStatus("idle"); }}
              placeholder="Paste your session key here…"
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={!importValue.trim()}
              className="shrink-0 gap-1.5"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>

          {importStatus === "ok" && (
            <p className="flex items-center gap-1 text-xs text-cyber">
              <Check className="h-3.5 w-3.5" /> Wallet history restored successfully.
            </p>
          )}
          {importStatus === "err" && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> Invalid key. Make sure you copied the full key.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

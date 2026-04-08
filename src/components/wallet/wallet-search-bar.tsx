"use client";

import { useState, useRef, type FormEvent } from "react";
import { Search, Clipboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectChain } from "@/hooks/use-wallet-lookup";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  onLookup: (address: string) => void;
  className?: string;
}

export function WalletSearchBar({ loading, onLookup, className }: Props) {
  const [value, setValue] = useState("");
  const [hint, setHint] = useState<"evm" | "solana" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(v: string) {
    setValue(v);
    setHint(detectChain(v.trim()));
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      handleChange(text.trim());
      inputRef.current?.focus();
    } catch { /* clipboard denied */ }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onLookup(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Paste 0x… or Solana address to inspect any wallet"
          className="pl-9 pr-24 font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
        />
        {hint && (
          <span
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              hint === "evm"
                ? "bg-eth/20 text-eth"
                : "bg-[#9B5BFF]/20 text-[#9B5BFF]"
            )}
          >
            {hint === "evm" ? "EVM" : "Solana"}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handlePaste}
        title="Paste from clipboard"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Clipboard className="h-4 w-4" />
      </button>

      <Button
        type="submit"
        disabled={loading || !value.trim()}
        className="shrink-0 gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Loading…" : "Inspect"}
      </Button>
    </form>
  );
}

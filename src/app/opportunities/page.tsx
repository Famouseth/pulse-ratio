"use client";

import { useMemo, useState, useId } from "react";
import { OpportunitiesTable } from "@/components/dashboard/opportunities-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataSources } from "@/components/ui/data-sources";
import { useOpportunities } from "@/hooks/use-opportunities";
import { X, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { Opportunity } from "@/types";

// ── Filter types ────────────────────────────────────────────────────────────

type FilterChip =
  | { id: string; kind: "text";    value: string }
  | { id: string; kind: "chain";   value: string }
  | { id: string; kind: "type";    value: "LP" | "Lending" }
  | { id: string; kind: "minApy";  value: number }
  | { id: string; kind: "maxApy";  value: number }
  | { id: string; kind: "minTvl";  value: number };

function applyFilter(data: Opportunity[], f: FilterChip): Opportunity[] {
  switch (f.kind) {
    case "text": {
      const q = f.value.toLowerCase();
      return data.filter((p) =>
        [p.protocol, p.chain, p.symbol, p.type].join(" ").toLowerCase().includes(q)
      );
    }
    case "chain":
      return data.filter((p) => p.chain.toLowerCase() === f.value.toLowerCase());
    case "type":
      return data.filter((p) => p.type === f.value);
    case "minApy":
      return data.filter((p) => p.apy >= f.value);
    case "maxApy":
      return data.filter((p) => p.apy <= f.value);
    case "minTvl":
      return data.filter((p) => p.tvlUsd >= f.value);
    default:
      return data;
  }
}

function chipLabel(f: FilterChip): string {
  switch (f.kind) {
    case "text":    return `"${f.value}"`;
    case "chain":   return `Chain: ${f.value}`;
    case "type":    return `Type: ${f.value}`;
    case "minApy":  return `APY ≥ ${f.value}%`;
    case "maxApy":  return `APY ≤ ${f.value}%`;
    case "minTvl":  return `TVL ≥ $${(f.value / 1_000_000).toFixed(1)}M`;
  }
}

const CHIP_COLORS: Record<FilterChip["kind"], string> = {
  text:    "border-white/20  text-foreground         bg-white/5",
  chain:   "border-[#06D6A0]/40 text-[#06D6A0]       bg-[#06D6A0]/10",
  type:    "border-[#a78bfa]/40 text-[#a78bfa]        bg-[#a78bfa]/10",
  minApy:  "border-emerald-500/40 text-emerald-400    bg-emerald-500/10",
  maxApy:  "border-rose-500/40    text-rose-400       bg-rose-500/10",
  minTvl:  "border-[#F7931A]/40   text-[#F7931A]      bg-[#F7931A]/10",
};

// ── Top chains to show as quick-pick buttons ────────────────────────────────
const QUICK_CHAINS = ["Ethereum", "Base", "Solana", "Arbitrum", "BSC", "Polygon", "Optimism", "Avalanche"];

export default function OpportunitiesPage() {
  const uid = useId();
  const makeId = () => `${uid}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: allData, isLoading } = useOpportunities();

  // ordered filter pipeline
  const [filters, setFilters] = useState<FilterChip[]>([]);

  // input staging state
  const [textInput,   setTextInput]   = useState("");
  const [minApyInput, setMinApyInput] = useState("");
  const [maxApyInput, setMaxApyInput] = useState("");
  const [minTvlInput, setMinTvlInput] = useState("");

  // ── helpers ────────────────────────────────────────────────────────────────

  function addFilter(chip: Omit<FilterChip, "id">) {
    // deduplicate same kind+value
    const already = filters.some(
      (f) => f.kind === chip.kind && String((f as FilterChip).value) === String(chip.value)
    );
    if (already) return;
    setFilters((prev) => [...prev, { ...chip, id: makeId() } as FilterChip]);
  }

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function addText() {
    const v = textInput.trim();
    if (!v) return;
    addFilter({ kind: "text", value: v });
    setTextInput("");
  }

  function addMinApy() {
    const v = parseFloat(minApyInput);
    if (!isNaN(v)) { addFilter({ kind: "minApy", value: v }); setMinApyInput(""); }
  }

  function addMaxApy() {
    const v = parseFloat(maxApyInput);
    if (!isNaN(v)) { addFilter({ kind: "maxApy", value: v }); setMaxApyInput(""); }
  }

  function addMinTvl() {
    const v = parseFloat(minTvlInput);
    if (!isNaN(v)) { addFilter({ kind: "minTvl", value: v * 1_000_000 }); setMinTvlInput(""); }
  }

  function toggleChain(chain: string) {
    const exists = filters.find((f) => f.kind === "chain" && f.value === chain);
    if (exists) removeFilter(exists.id);
    else addFilter({ kind: "chain", value: chain });
  }

  function toggleType(type: "LP" | "Lending") {
    const exists = filters.find((f) => f.kind === "type" && f.value === type);
    if (exists) removeFilter(exists.id);
    else addFilter({ kind: "type", value: type });
  }

  // ── pipeline: apply filters in order ──────────────────────────────────────
  const filtered = useMemo(() => {
    let result = allData ?? [];
    for (const f of filters) {
      result = applyFilter(result, f);
    }
    return result;
  }, [allData, filters]);

  // derive unique chains present in data for "available" indicators
  const availableChains = useMemo(() => {
    const s = new Set((allData ?? []).map((p) => p.chain));
    return s;
  }, [allData]);

  const activeChains = new Set(
    filters.filter((f) => f.kind === "chain").map((f) => (f as FilterChip & { kind: "chain" }).value)
  );
  const activeTypes  = new Set(
    filters.filter((f) => f.kind === "type").map((f)  => (f as FilterChip & { kind: "type" }).value)
  );

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold">All-Protocol LP &amp; Lending Opportunities</h1>
        <DataSources sources={["defillamaYields", "aave", "uniswap", "defillama"]} />
      </div>

      {/* ── Filter builder panel ─────────────────────────────────────────── */}
      <Card className="border-white/5 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {filters.length > 0 && (
              <button
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setFilters([])}
              >
                Clear all
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">

          {/* Row 1: text search */}
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addText()}
              placeholder="Search protocol, chain, pair..."
              className="h-8 text-sm bg-black/30"
            />
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs shrink-0" onClick={addText}>
              + Add
            </Button>
          </div>

          {/* Row 2: chain quick-picks */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">Chain:</span>
            {QUICK_CHAINS.filter((c) => availableChains.has(c)).map((c) => (
              <button
                key={c}
                onClick={() => toggleChain(c)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  activeChains.has(c)
                    ? "border-[#06D6A0]/60 bg-[#06D6A0]/20 text-[#06D6A0]"
                    : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Row 3: type + APY + TVL inputs */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type toggles */}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Type:</span>
            {(["LP", "Lending"] as const).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  activeTypes.has(t)
                    ? t === "LP"
                      ? "border-yellow-500/60 bg-yellow-500/20 text-yellow-400"
                      : "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                    : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}

            <span className="text-white/10">|</span>

            {/* APY range */}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">APY:</span>
            <div className="flex items-center gap-1">
              <Input
                value={minApyInput}
                onChange={(e) => setMinApyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMinApy()}
                placeholder="min%"
                className="h-7 w-16 text-xs bg-black/30 px-2"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addMinApy}>≥</Button>
            </div>
            <div className="flex items-center gap-1">
              <Input
                value={maxApyInput}
                onChange={(e) => setMaxApyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMaxApy()}
                placeholder="max%"
                className="h-7 w-16 text-xs bg-black/30 px-2"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addMaxApy}>≤</Button>
            </div>

            <span className="text-white/10">|</span>

            {/* TVL min */}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">TVL&nbsp;≥:</span>
            <div className="flex items-center gap-1">
              <Input
                value={minTvlInput}
                onChange={(e) => setMinTvlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMinTvl()}
                placeholder="$M"
                className="h-7 w-16 text-xs bg-black/30 px-2"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addMinTvl}>+M</Button>
            </div>
          </div>

          {/* Active filter pipeline chips */}
          {filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">Active:</span>
              {filters.map((f, idx) => (
                <span key={f.id} className="inline-flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHIP_COLORS[f.kind]}`}
                  >
                    {chipLabel(f)}
                    <button
                      onClick={() => removeFilter(f.id)}
                      className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Remove filter"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                </span>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Unified BTC/ETH Table (EVM + Solana)</span>
            {!isLoading && (
              <span className="text-xs font-normal text-muted-foreground">
                {filtered.length}{filters.length > 0 ? ` / ${(allData ?? []).length}` : ""} pools
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunitiesTable data={filtered} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}


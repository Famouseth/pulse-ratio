"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshBadgeProps {
  /** Timestamp (ms) of last successful data fetch */
  lastUpdated: number | null;
  /** Called when user clicks the manual refresh button */
  onRefresh?: () => void;
  /** Total interval between auto-refreshes (ms) — drives the progress ring */
  intervalMs?: number;
  /** Shows a spinner on the refresh icon */
  isRefreshing?: boolean;
  className?: string;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem > 0 ? `${m}m ${rem}s ago` : `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const CIRCUMFERENCE = 2 * Math.PI * 8; // r=8

export function RefreshBadge({
  lastUpdated,
  onRefresh,
  intervalMs,
  isRefreshing,
  className
}: RefreshBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const age = lastUpdated ? now - lastUpdated : null;
  const progress =
    lastUpdated && intervalMs
      ? Math.min(100, ((now - lastUpdated) / intervalMs) * 100)
      : 0;
  const isStale = progress > 80;
  const ringColor = isStale ? "#F7931A" : "#06D6A0";
  const dashOffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Countdown ring */}
      <div className="relative h-5 w-5 flex-shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 20 20">
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke={ringColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
      </div>

      <span className="text-xs text-muted-foreground tabular-nums">
        {age !== null ? formatElapsed(age) : "Loading…"}
      </span>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh now"
          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          <RefreshCw
            className={cn("h-3 w-3", isRefreshing && "animate-spin")}
          />
        </button>
      )}
    </div>
  );
}

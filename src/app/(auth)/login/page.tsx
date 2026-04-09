"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: value })
    });

    setLoading(false);
    if (res.ok) {
      router.replace("/");
    } else {
      setError(true);
      setValue("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c18]">
      {/* subtle radial glow behind card */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 42%, rgba(98,126,234,0.12) 0%, transparent 70%)"
        }}
      />

      <div className="relative w-full max-w-sm space-y-8 px-4">
        {/* ── ETH Diamond Logo ───────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative flex items-center justify-center"
            style={{ filter: "drop-shadow(0 0 24px rgba(98,126,234,0.55))" }}
          >
            {/* Ethereum diamond SVG */}
            <svg width="72" height="72" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* top cap */}
              <polygon points="127.9,0 127.9,152.3 250.4,208.2" fill="#627EEA" opacity="0.6" />
              <polygon points="127.9,0 5.3,208.2 127.9,152.3" fill="#627EEA" />
              {/* middle band */}
              <polygon points="127.9,176.5 5.3,208.2 127.9,270.9" fill="#627EEA" opacity="0.45" />
              <polygon points="127.9,270.9 250.4,208.2 127.9,176.5" fill="#627EEA" opacity="0.8" />
              {/* lower body */}
              <polygon points="5.3,231.5 127.9,416.8 127.9,294.1" fill="#627EEA" opacity="0.5" />
              <polygon points="127.9,294.1 127.9,416.8 250.6,231.5" fill="#627EEA" opacity="0.15" />
            </svg>
          </div>

          {/* App name under logo */}
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight">
              <span className="text-[#F7931A]">BTC</span>
              <span className="text-white/25 mx-1.5">vs</span>
              <span className="text-[#627EEA]">ETH</span>
            </p>
            <p className="text-xs text-white/35 mt-1 tracking-wide">Enter password to continue</p>
          </div>
        </div>

        {/* ── Form ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            autoFocus
            autoComplete="current-password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:ring-1 ${
              error
                ? "border-rose-500/60 focus:ring-rose-500/40"
                : "border-[#627EEA]/30 focus:border-[#627EEA]/60 focus:ring-[#627EEA]/20"
            }`}
          />
          {error && (
            <p className="text-xs text-rose-400 pl-1">Incorrect password — try again.</p>
          )}
          <button
            type="submit"
            disabled={loading || !value}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #627EEA 0%, #8fa4f0 100%)",
              boxShadow: value && !loading ? "0 0 18px rgba(98,126,234,0.4)" : "none"
            }}
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

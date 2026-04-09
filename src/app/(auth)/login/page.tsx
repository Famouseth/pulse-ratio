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
      <div className="w-full max-w-sm space-y-6 px-4">
        {/* Logo / Title */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-[#F7931A]">BTC</span>
              <span className="text-white/30 mx-1">vs</span>
              <span className="text-[#627EEA]">ETH</span>
            </span>
          </div>
          <p className="text-sm text-white/40">Enter password to continue</p>
        </div>

        {/* Form */}
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
                : "border-white/10 focus:border-white/30 focus:ring-white/20"
            }`}
          />
          {error && (
            <p className="text-xs text-rose-400 pl-1">Incorrect password — try again.</p>
          )}
          <button
            type="submit"
            disabled={loading || !value}
            className="w-full rounded-xl bg-[#F7931A] py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CandlestickChart, Gem, LayoutDashboard, Scale, Search, Wallet, BarChartBig, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tvl", label: "TVL Analytics", icon: BarChartBig },
  { href: "/opportunities", label: "Opportunities", icon: Search },
  { href: "/bonding", label: "Bonding Hub", icon: Gem },
  { href: "/charts", label: "Charts", icon: CandlestickChart },
  { href: "/arb", label: "Arbitrage", icon: Scale },
  { href: "/portfolio", label: "Wallet Tracker", icon: Wallet },
  { href: "/stats", label: "Stats", icon: Activity },
  { href: "/pulsechain", label: "PulseChain", icon: Zap, pulse: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/30 p-4 lg:block">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyber">BTCvsETH</p>
        <h2 className="mt-1 text-xl font-semibold">BTC vs ETH Control Room</h2>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const isPulse = "pulse" in item && item.pulse;
          return (
            <Link
              key={item.href}
              href={item.href as string}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? isPulse
                    ? "bg-[#9333ea]/20 text-[#9333ea]"
                    : "bg-primary/20 text-primary"
                  : isPulse
                    ? "text-[#9333ea]/70 hover:bg-[#9333ea]/10 hover:text-[#9333ea]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {isPulse && !active && (
                <span className="ml-auto text-[9px] font-bold tracking-widest rounded-full px-1.5 py-0.5 bg-[#9333ea]/20 text-[#9333ea]">
                  PLS
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

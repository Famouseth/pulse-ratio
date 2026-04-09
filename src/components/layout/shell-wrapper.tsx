"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const NO_SHELL_PATHS = ["/login"];

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = NO_SHELL_PATHS.includes(pathname);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen cyber-grid">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

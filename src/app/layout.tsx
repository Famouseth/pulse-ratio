import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BTCvsETH - BTC vs ETH TVL & LP Bonding Dashboard",
  description: "Real-time BTC vs ETH TVL comparison, LP and lending opportunities, bonding analytics, and arbitrage scanner."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={spaceGrotesk.className}>
        <Providers>
          <div className="flex min-h-screen cyber-grid">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <TopBar />
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

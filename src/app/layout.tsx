import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ShellWrapper } from "@/components/layout/shell-wrapper";

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
          <ShellWrapper>{children}</ShellWrapper>
        </Providers>
      </body>
    </html>
  );
}

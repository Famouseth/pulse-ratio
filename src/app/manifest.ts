import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PulseRatio - BTC vs ETH TVL Dashboard",
    short_name: "PulseRatio",
    description: "Real-time BTC vs ETH TVL and LP bonding dashboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#04060d",
    theme_color: "#070b1a",
    icons: []
  };
}

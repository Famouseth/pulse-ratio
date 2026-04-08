/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com"
      }
    ]
  },
  turbopack: {
    // Stub optional peer deps that wallet SDKs reference but don't need in browser builds
    resolveAlias: {
      "@react-native-async-storage/async-storage": { browser: "./src/lib/empty-stub.js" },
      "pino-pretty": { browser: "./src/lib/empty-stub.js" }
    }
  }
};

export default nextConfig;

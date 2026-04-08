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
  webpack: (config) => {
    // silence missing optional peer deps from MetaMask SDK and WalletConnect
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false
    };
    return config;
  }
};

export default nextConfig;

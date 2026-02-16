import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    root: import.meta.dirname,
  },
  // Webpack config for @react-pdf/renderer compatibility (used in production builds)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

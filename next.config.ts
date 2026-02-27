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
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Include public assets in serverless function bundle for PDF generation
  outputFileTracingIncludes: {
    "/api/proposals/[id]/export": [
      "./public/fonts/**/*",
      "./public/images/**/*",
    ],
  },
  // Keep webpack canvas alias while @react-pdf/renderer is still installed
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

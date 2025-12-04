import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(
  __dirname,
  "src/visual-edits/component-tagger-loader.js"
);

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages + Static Export + APK
  output: "export",

  images: {
    unoptimized: true, // Required for static export deployment
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  experimental: {
    optimizePackageImports: [],
  },

  outputFileTracingRoot: path.resolve(__dirname, "../../"),

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER],
      },
    },
  },
};

export default nextConfig;

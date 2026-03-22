import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: true,
    cpus: 1,
  },
  reactStrictMode: false,
};

export default nextConfig;

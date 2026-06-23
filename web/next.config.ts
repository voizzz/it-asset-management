import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Next.js 16 feature not yet in TS types
  allowedDevOrigins: ['10.62.36.18', 'localhost'],
};

export default nextConfig;

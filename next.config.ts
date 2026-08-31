import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited tabs in the client router cache briefly so bouncing
    // between them is instant instead of a fresh server round-trip.
    staleTimes: {
      dynamic: 20,
      static: 180,
    },
  },
};

export default nextConfig;

import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly — without this, Turbopack's root
  // inference climbs up to a stray package.json in the home directory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

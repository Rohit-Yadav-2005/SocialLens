import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly: an unrelated package-lock.json in
  // the user's home directory would otherwise make Next.js guess wrong.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

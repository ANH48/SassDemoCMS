import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/types"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;

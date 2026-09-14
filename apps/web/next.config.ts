import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@johel/jd-meta", "@johel/resume", "@johel/prompt-defaults"],
};

export default nextConfig;

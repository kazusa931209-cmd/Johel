import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@johel/jd-meta", "@johel/resume", "@johel/prompt-defaults"],
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcryptjs",
    "@libsql/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
};

export default nextConfig;

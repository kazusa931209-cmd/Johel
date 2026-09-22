import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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

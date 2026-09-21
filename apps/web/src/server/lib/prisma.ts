import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);

function isTursoDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) {
    return false;
  }
  return (
    databaseUrl.startsWith("libsql://") ||
    databaseUrl.startsWith("https://") ||
    Boolean(process.env.TURSO_AUTH_TOKEN?.trim())
  );
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (isTursoDatabaseUrl(databaseUrl)) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    const { PrismaLibSQL } =
      require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({
      url: databaseUrl,
      authToken: authToken || undefined,
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

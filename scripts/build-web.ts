import { spawnSync } from "node:child_process";
import { isTursoDatabaseUrl } from "../src/server/lib/database-url";

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("pnpm", ["exec", "prisma", "generate"]);

if (isTursoDatabaseUrl(process.env.DATABASE_URL)) {
  run("pnpm", ["exec", "tsx", "scripts/migrate-deploy-turso.ts"]);
} else {
  run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
}

run("pnpm", ["exec", "next", "build"]);

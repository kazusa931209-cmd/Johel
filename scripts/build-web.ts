import { spawnSync } from "node:child_process";

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
run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
run("pnpm", ["exec", "next", "build"]);

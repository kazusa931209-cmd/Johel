import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type Client } from "@libsql/client";
import { isTursoDatabaseUrl } from "../src/server/lib/database-url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(scriptDir, "../prisma/migrations");

const PRISMA_MIGRATIONS_DDL = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
);
`.trim();

function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

function splitMigrationSql(sql: string): string[] {
  const lines = sql.split("\n");
  const statements: string[] = [];
  let buffer = "";
  for (const line of lines) {
    if (line.trimStart().startsWith("--")) {
      continue;
    }
    buffer += `${line}\n`;
    if (line.trimEnd().endsWith(";")) {
      const statement = buffer.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      buffer = "";
    }
  }
  const trailing = buffer.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }
  return statements;
}

async function listMigrationFolders(): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function loadAppliedMigrations(
  client: Client,
): Promise<Map<string, string>> {
  const applied = new Map<string, string>();
  try {
    const result = await client.execute(
      `SELECT "migration_name", "checksum" FROM "_prisma_migrations"`,
    );
    for (const row of result.rows) {
      const name = row.migration_name as string;
      const checksum = row.checksum as string;
      applied.set(name, checksum);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("no such table")) {
      await client.execute(PRISMA_MIGRATIONS_DDL);
      return applied;
    }
    throw error;
  }
  return applied;
}

async function applyMigration(
  client: Client,
  migrationName: string,
  sql: string,
  checksum: string,
): Promise<void> {
  const statements = splitMigrationSql(sql);
  if (statements.length === 0) {
    throw new Error(`Migration ${migrationName} has no executable SQL.`);
  }

  const startedAt = new Date().toISOString().replace("T", " ").replace("Z", "");
  const migrationId = randomUUID();

  await client.batch(
    [
      {
        sql: `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES (?, ?, NULL, ?, NULL, NULL, ?, 0)`,
        args: [migrationId, checksum, migrationName, startedAt],
      },
    ],
    "write",
  );

  try {
    await client.batch(
      statements.map((statement) => ({ sql: statement, args: [] as never[] })),
      "write",
    );
  } catch (error) {
    await client.execute({
      sql: `DELETE FROM "_prisma_migrations" WHERE "id" = ?`,
      args: [migrationId],
    });
    throw error;
  }

  const finishedAt = new Date()
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
  await client.execute({
    sql: `UPDATE "_prisma_migrations" SET "finished_at" = ?, "applied_steps_count" = 1 WHERE "id" = ?`,
    args: [finishedAt, migrationId],
  });
}

function createTursoClient(): Client {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!isTursoDatabaseUrl(databaseUrl)) {
    throw new Error(
      "migrate-deploy-turso requires a Turso/libSQL DATABASE_URL (not file:).",
    );
  }
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (
    (databaseUrl.startsWith("libsql://") ||
      databaseUrl.startsWith("https://")) &&
    !authToken
  ) {
    throw new Error("TURSO_AUTH_TOKEN is required for remote Turso DATABASE_URL.");
  }
  return createClient({
    url: databaseUrl,
    authToken: authToken || undefined,
  });
}

async function main(): Promise<void> {
  const client = createTursoClient();
  await client.execute(PRISMA_MIGRATIONS_DDL);

  const folders = await listMigrationFolders();
  const applied = await loadAppliedMigrations(client);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const folder of folders) {
    const sqlPath = path.join(migrationsDir, folder, "migration.sql");
    const sql = await readFile(sqlPath, "utf8");
    const checksum = migrationChecksum(sql);
    const existingChecksum = applied.get(folder);

    if (existingChecksum !== undefined) {
      if (existingChecksum !== checksum) {
        throw new Error(
          `Migration ${folder} was already applied with a different checksum.`,
        );
      }
      skippedCount += 1;
      continue;
    }

    console.log(`Applying migration ${folder}…`);
    await applyMigration(client, folder, sql, checksum);
    appliedCount += 1;
  }

  console.log(
    `Turso migrate deploy finished: ${appliedCount} applied, ${skippedCount} already applied.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

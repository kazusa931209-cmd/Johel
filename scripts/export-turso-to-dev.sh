#!/usr/bin/env sh
# Export Turso production DB to local SQLite for pnpm dev (prisma/dev.db).
# Requires: turso CLI logged in (turso auth login).
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${TURSO_DB_NAME:-johel}"
OUTPUT_FILE="${TURSO_EXPORT_OUTPUT:-prisma/dev.db}"

if ! command -v turso >/dev/null 2>&1; then
  echo "turso CLI not found. Install: https://docs.turso.tech/cli" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "Exporting Turso database '$DB_NAME' → $OUTPUT_FILE (overwrites local dev data)."
turso db export "$DB_NAME" --overwrite --output-file "$OUTPUT_FILE"
echo "Done. Use DATABASE_URL=file:./dev.db in .env and restart pnpm dev if it is running."

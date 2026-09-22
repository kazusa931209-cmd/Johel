#!/usr/bin/env sh
set -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 <source.db> [output.db]" >&2
  echo "Prepares a SQLite snapshot for turso db import (journal_mode=WAL required)." >&2
  exit 1
fi

SRC="$1"
if [ ! -f "$SRC" ]; then
  echo "Source file not found: $SRC" >&2
  exit 1
fi

if [ -n "$2" ]; then
  OUT="$2"
else
  base="${SRC%.db}"
  OUT="${base}-wal.db"
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required but not found in PATH." >&2
  exit 1
fi

cp "$SRC" "$OUT"
sqlite3 "$OUT" "PRAGMA journal_mode=WAL;"
sqlite3 "$OUT" "PRAGMA wal_checkpoint(FULL);"
mode="$(sqlite3 "$OUT" "PRAGMA journal_mode;")"
if [ "$mode" != "wal" ]; then
  echo "Failed to set journal_mode=WAL (got: $mode)" >&2
  exit 1
fi

echo "WAL-ready database: $OUT"
echo "Import with: turso db import <db-name> \"$OUT\""

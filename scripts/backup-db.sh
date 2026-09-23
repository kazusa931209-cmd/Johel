#!/usr/bin/env sh
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
CONTAINER="${JOHEL_CONTAINER:-app-johel}"
DB_PATH="${JOHEL_DB_PATH:-/data/johel.db}"

mkdir -p "$BACKUP_DIR"
OUT_FILE="$BACKUP_DIR/johel-${TIMESTAMP}.db"

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker exec "$CONTAINER" sh -c "sqlite3 '$DB_PATH' '.backup /tmp/johel-backup.db'"
  docker cp "$CONTAINER:/tmp/johel-backup.db" "$OUT_FILE"
  docker exec "$CONTAINER" rm -f /tmp/johel-backup.db
else
  SRC="${LOCAL_DB_PATH:-./prisma/dev.db}"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$SRC" ".backup '$OUT_FILE'"
  else
    cp "$SRC" "$OUT_FILE"
  fi
fi

find "$BACKUP_DIR" -type f -name 'johel-*.db' -mtime +"$RETENTION_DAYS" -delete

echo "Backup written to $OUT_FILE"

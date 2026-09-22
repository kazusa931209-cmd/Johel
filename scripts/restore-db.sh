#!/usr/bin/env sh
set -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.db>" >&2
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="${JOHEL_CONTAINER:-app-johel}"
DB_PATH="${JOHEL_DB_PATH:-/data/johel.db}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

printf 'Restore %s into JoHEL database? Type RESTORE to continue: ' "$BACKUP_FILE"
read -r CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker cp "$BACKUP_FILE" "$CONTAINER:/tmp/johel-restore.db"
  docker exec "$CONTAINER" sh -c "cp /tmp/johel-restore.db '$DB_PATH'"
  docker exec "$CONTAINER" rm -f /tmp/johel-restore.db
  echo "Restore complete. Restart the container if the app was running."
else
  DEST="${LOCAL_DB_PATH:-./prisma/dev.db}"
  cp "$BACKUP_FILE" "$DEST"
  echo "Restore complete: $DEST"
fi

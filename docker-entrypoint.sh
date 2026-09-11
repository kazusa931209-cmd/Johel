#!/bin/sh
set -e

mkdir -p /data

cd /app/apps/api
npx prisma migrate deploy

HOST=127.0.0.1 PORT=4042 npx tsx src/index.ts &
API_PID=$!

echo "Waiting for API health..."
until node -e "fetch('http://127.0.0.1:4042/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "API process exited during startup."
    wait "$API_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done
echo "API is ready."

shutdown() {
  kill "$API_PID" 2>/dev/null || true
  kill "$WEB_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  wait "$WEB_PID" 2>/dev/null || true
  exit 0
}

trap shutdown TERM INT

cd /app
PORT=${WEB_PORT:-4321} HOSTNAME=0.0.0.0 node apps/web/server.js &
WEB_PID=$!

wait "$WEB_PID"
shutdown

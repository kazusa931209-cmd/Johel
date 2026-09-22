#!/bin/sh
set -e

cd /app/apps/web
npx prisma migrate deploy

cd /app
PORT=${WEB_PORT:-4321} HOSTNAME=0.0.0.0 node apps/web/server.js

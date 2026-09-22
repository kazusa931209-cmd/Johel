#!/bin/sh
set -e

cd /app
npx prisma migrate deploy

PORT=${WEB_PORT:-4321} HOSTNAME=0.0.0.0 node server.js

# Vercel build fix: Prisma migrate vs Turso

**Date:** 2026-09-22  
**Status:** Implemented

## Problem

Vercel sets `DATABASE_URL=libsql://…` for Turso. The web build ran `prisma migrate deploy`, which validates SQLite datasources as `file:` only → **P1012** at build time. Runtime already used `@prisma/adapter-libsql` in `apps/web/src/server/lib/prisma.ts`.

## Solution

| Layer | Behavior |
| --- | --- |
| `apps/web/src/server/lib/database-url.ts` | Shared `isTursoDatabaseUrl()` — remote libSQL; never `file:` even if `TURSO_AUTH_TOKEN` is set |
| `apps/web/scripts/migrate-deploy-turso.ts` | Applies pending `prisma/migrations/*/migration.sql` via `@libsql/client`; SHA-256 checksums match Prisma |
| `apps/web/scripts/build-web.ts` | `prisma generate` → Turso script **or** `prisma migrate deploy` → `next build` |
| `apps/web/package.json` | `"build": "tsx scripts/build-web.ts"`, `"db:migrate-deploy": "tsx --env-file=.env scripts/migrate-deploy-turso.ts"` |

CI and Docker unchanged: `file:` URL + `prisma migrate deploy`.

## Docs updated

- [`vercel-deploy.md`](../vercel-deploy.md) — schema migrations section, troubleshooting
- [`technology.md`](../technology.md), [`ci-cd.md`](../ci-cd.md)
- [`plans/2026-09-22-phase-93-nextjs-turso-migration.md`](./2026-09-22-phase-93-nextjs-turso-migration.md) — §2.3 correction
- [`apps/web/.env.example`](../../apps/web/.env.example)

## Verification

- `DATABASE_URL=file:./prisma/ci-build.db` + `tsx scripts/build-web.ts` — full build OK
- `libsql://` without token — migrate script exits 1 with clear error
- Init migration checksum matches local `_prisma_migrations` row

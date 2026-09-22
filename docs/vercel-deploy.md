# Vercel deployment (Turso)

Production target after **Phase 93**: one Next.js deployment on Vercel, database on **Turso**, local dev on **SQLite file**.

Related: [`technology.md`](./technology.md) (architecture), [`vercel.json`](../vercel.json), [`apps/web/.env.example`](../apps/web/.env.example), Turso data cutover in [`technology.md`](./technology.md) (Turso cutover + WAL import).

## Vercel project settings

| Setting | Value |
| --- | --- |
| **Root Directory** | Repository root (default) — monorepo uses root `package.json` + `pnpm-workspace.yaml` |
| **Framework Preset** | Next.js (also set in `vercel.json`) |
| **Install Command** | `pnpm install --frozen-lockfile` |
| **Build Command** | `pnpm --filter web build` (runs `prisma generate`, Turso migrate script **or** `prisma migrate deploy`, then `next build`) |
| **Node.js** | 20.x (match root `engines`) |

`vercel.json` sets **300s** `maxDuration` on [`apps/web/src/app/backend/[...path]/route.ts`](../apps/web/src/app/backend/[...path]/route.ts). Long AI/resume routes need a **Vercel plan** that allows 300s serverless duration (Pro or equivalent).

## Environment variables checklist

Set these in **Vercel → Project → Settings → Environment Variables**. Use separate Turso databases for **Preview** and **Production** unless you intentionally share one DB (not recommended).

### Required — Production

| Variable | Example / notes | Environments |
| --- | --- | --- |
| `DATABASE_URL` | `libsql://your-db-name-org.turso.io` from `turso db show <name> --url` | Production |
| `TURSO_AUTH_TOKEN` | From `turso db tokens create <name>` | Production |
| `JWT_SECRET` | Min **32** chars; not `change-me*` (see `deploy-config.ts`) | Production |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` — **must match** the key used when user API keys were encrypted in the source SQLite | Production |
| `PUBLIC_DEPLOY` | `true` | Production |
| `TRUST_PROXY` | `true` (Vercel terminates TLS; app reads `x-forwarded-*`) | Production |
| `PUBLIC_URL` | `https://your-production-domain.com` (no trailing slash) | Production |

With `PUBLIC_DEPLOY=true`, the app **fails fast at runtime** if `JWT_SECRET`, `ENCRYPTION_KEY`, or `TRUST_PROXY` are missing or weak.

### Required — Preview (recommended staging)

Use a **staging** Turso DB (`johel-staging`) and the **same** `JWT_SECRET` / `ENCRYPTION_KEY` as production only if preview uses a **copy** of production data and you accept shared sessions/crypto. Safer: separate secrets per environment and a staging-only DB import.

| Variable | Notes | Environments |
| --- | --- | --- |
| `DATABASE_URL` | Staging Turso URL | Preview |
| `TURSO_AUTH_TOKEN` | Staging token | Preview |
| `JWT_SECRET` | Strong secret (≥ 32 chars) | Preview |
| `ENCRYPTION_KEY` | Same as production **if** preview DB was imported from prod SQLite with encrypted keys | Preview |
| `PUBLIC_DEPLOY` | `true` | Preview |
| `TRUST_PROXY` | `true` | Preview |
| `PUBLIC_URL` | `https://<project>-git-<branch>-<team>.vercel.app` or custom preview domain | Preview |

Update `PUBLIC_URL` when you add a **custom preview domain**; it is used for CORS allowlist on the Hono app (legacy cross-origin cases).

### Do not set on Vercel

| Variable | Why |
| --- | --- |
| `API_ORIGIN` | Removed — no separate Hono process |
| `PORT` / `HOST` for API | Not used |

### Optional (all environments)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_TTL` | `7d` | JWT session lifetime (`7d`, `24h`, etc.) |
| `SESSION_COOKIE_SECURE` | inferred from `x-forwarded-proto` on Vercel | Force `true`/`false` if needed |
| `RATE_LIMIT_*` | see `apps/web/src/server/lib/rate-limit.ts` | Override rate limits |
| `NEXT_TELEMETRY_DISABLED` | — | `1` to disable Next telemetry (CI already sets this) |

### Local development (not Vercel)

Use [`apps/web/.env`](../apps/web/.env) (from [`.env.example`](../apps/web/.env.example)):

- `DATABASE_URL="file:./prisma/dev.db"`
- `JWT_SECRET` — weak default OK
- **Do not** set `PUBLIC_DEPLOY` locally unless testing hardening
- `TURSO_*` — only when pointing local runs at a remote Turso DB

## Preview vs Production — quick matrix

| Concern | Preview | Production |
| --- | --- | --- |
| Turso database | Staging DB (import test snapshot) | Production DB |
| `PUBLIC_URL` | Preview deployment URL | Custom domain |
| Secrets after SQLite import | Match source env for `ENCRYPTION_KEY` | Match source env for `ENCRYPTION_KEY` |
| Schema migrations at deploy | Turso migrate script on build (staging DB) | Turso migrate script on build (production DB) |
| Data writes | Safe for QA | Live users |

## Schema migrations on Turso

Prisma CLI `migrate deploy` only accepts `file:` URLs. On Vercel, when `DATABASE_URL` is `libsql://` (or Turso HTTPS URL), the build runs [`apps/web/scripts/migrate-deploy-turso.ts`](../apps/web/scripts/migrate-deploy-turso.ts) instead: it applies any pending `prisma/migrations/*/migration.sql` to Turso via `@libsql/client` and updates `_prisma_migrations` (same checksums as Prisma).

- **Author migrations locally:** `pnpm db:migrate` against `file:./prisma/dev.db`.
- **Test against staging Turso from a laptop:** set `DATABASE_URL` + `TURSO_AUTH_TOKEN` in `apps/web/.env`, then `pnpm --filter web db:migrate-deploy`.
- **After SQLite import:** `_prisma_migrations` is already populated; the Turso script applies nothing until a **new** migration lands in git.

## First deploy sequence

1. Create Turso DB(s) and import data (WAL-ready file — [`scripts/prepare-sqlite-for-turso-import.sh`](../scripts/prepare-sqlite-for-turso-import.sh)).
2. Add **Preview** env vars → deploy a branch → smoke test login, settings (API key), one AI call.
3. Add **Production** env vars → deploy `main` → repeat smoke tests.
4. If any user still has plaintext API keys in DB, run locally against Turso once:
   ```bash
   cd apps/web
   DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" ENCRYPTION_KEY="…" pnpm db:migrate-keys
   ```
5. Keep a SQLite backup until production is verified.

## Smoke test after deploy

Quick health check (replace host with Preview or Production URL):

```bash
curl -fsS "https://YOUR_DEPLOYMENT_HOST/backend/health"
```

Expect JSON `{ "ok": true }`.

- `GET /backend/health` → `{ "ok": true }`
- Register or log in with migrated user
- **Settings → Environment** — saved OpenAI/Cursor key still works (encryption key correct)
- One short AI action (e.g. verdict) and resume export if you rely on long routes (confirms timeout config)

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Build fails with P1012 (`URL must start with file:`) | Outdated build script — current build must use Turso migrate script when `DATABASE_URL` is `libsql://` |
| Build fails during Turso migrate script | Wrong `DATABASE_URL` / `TURSO_AUTH_TOKEN`; SQL error in a new migration; checksum mismatch if migration folder was edited after apply |
| Build fails on `prisma migrate deploy` (CI / local file URL) | Wrong `DATABASE_URL`; migration history mismatch vs database |
| 500 on every `/backend/*` with `PUBLIC_DEPLOY` message | Weak `JWT_SECRET`, missing `ENCRYPTION_KEY`, or `TRUST_PROXY` not `true` |
| AI calls fail after Turso import | `ENCRYPTION_KEY` on Vercel ≠ key used when keys were saved in SQLite |
| AI/resume times out at 60s | Plan limit; confirm `maxDuration: 300` in `vercel.json` and route `export const maxDuration = 300` |
| Turso import rejected | SQLite not `journal_mode=WAL` — run prepare script |

# Vercel deployment (Turso)

**Deployment model:** two environments only — **local development** (SQLite file, `pnpm dev:web`, no Docker required) and **Vercel Production** (Turso). There is no Vercel Preview / staging deployment.

Related: [`technology.md`](./technology.md) (architecture), [`ci-cd.md`](./ci-cd.md), [`vercel.json`](../vercel.json), [`apps/web/.env.example`](../apps/web/.env.example), Turso data cutover in [`technology.md`](./technology.md) (Turso cutover + WAL import).

## Vercel project settings

| Setting | Value |
| --- | --- |
| **Root Directory** | Repository root (default) — monorepo uses root `package.json` + `pnpm-workspace.yaml` |
| **Framework Preset** | Next.js (also set in `vercel.json`) |
| **Install Command** | `pnpm install --frozen-lockfile` |
| **Build Command** | `pnpm --filter web build` (runs `prisma generate`, Turso migrate script, then `next build`) |
| **Node.js** | 20.x (match root `engines`) |
| **Production Branch** | `main` (or your chosen production branch) |

### Disable Preview deployments

In **Vercel → Project → Settings → Git**:

- Turn off **Preview Deployments** for pull requests and/or non-production branches (wording varies by Vercel UI version).

Only **Production** builds should run. Pull requests are still validated by **GitHub Actions** ([`ci-cd.md`](./ci-cd.md)); they do not need a Vercel Preview URL.

[`apps/web/src/app/backend/[...path]/route.ts`](../apps/web/src/app/backend/[...path]/route.ts) exports **`maxDuration = 300`** (App Router segment config). Vercel’s root `vercel.json` `functions` globs do not apply to `app/**/route.ts`, so duration is configured in the route file only. Long AI/resume routes need a **Vercel plan** that allows 300s serverless duration (Pro or equivalent).

## Environment variables (Production only)

Set these in **Vercel → Project → Settings → Environment Variables** and scope them to **Production** only (do not duplicate for Preview).

| Variable | Example / notes |
| --- | --- |
| `DATABASE_URL` | `libsql://your-db-name-org.turso.io` from `turso db show <name> --url` |
| `TURSO_AUTH_TOKEN` | From `turso db tokens create <name>` |
| `JWT_SECRET` | Min **32** chars; not `change-me*` (see `deploy-config.ts`) |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` — **must match** the key used when user API keys were encrypted in the source SQLite |
| `PUBLIC_DEPLOY` | `true` |
| `TRUST_PROXY` | `true` (Vercel terminates TLS; app reads `x-forwarded-*`) |
| `PUBLIC_URL` | `https://your-production-domain.com` (no trailing slash) |

With `PUBLIC_DEPLOY=true`, the app **fails fast at runtime** if `JWT_SECRET`, `ENCRYPTION_KEY`, or `TRUST_PROXY` are missing or weak.

### Do not set on Vercel

| Variable | Why |
| --- | --- |
| `API_ORIGIN` | Removed — no separate Hono process |
| `PORT` / `HOST` for API | Not used |

### Optional (Production)

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
- **Do not** set `TURSO_*` for normal local dev

## Local vs Production

| Concern | Local (`pnpm dev:web`) | Vercel Production |
| --- | --- | --- |
| Database | SQLite `file:./prisma/dev.db` | Turso (`libsql://` + token) |
| Migrations | `pnpm db:migrate` | Turso migrate script on production build |
| Secrets | Dev defaults in `.env` | Strong secrets on Vercel (Production scope) |
| `PUBLIC_URL` | Not required | Production custom domain |

## Schema migrations on Turso

Prisma CLI `migrate deploy` only accepts `file:` URLs. On Vercel Production, the build runs [`apps/web/scripts/migrate-deploy-turso.ts`](../apps/web/scripts/migrate-deploy-turso.ts): it applies pending `prisma/migrations/*/migration.sql` via `@libsql/client` and updates `_prisma_migrations` (same checksums as Prisma).

- **Author migrations locally:** `pnpm db:migrate` against `file:./prisma/dev.db`.
- **Before merging to `main`:** GitHub Actions runs `prisma migrate deploy` against ephemeral SQLite (`file:./prisma/ci-build.db`) to prove migrations apply.
- **On merge / production deploy:** the Turso script runs against the **production** Turso DB configured on Vercel.
- **Optional dry run against Turso from a laptop:** set production `DATABASE_URL` + `TURSO_AUTH_TOKEN` in `apps/web/.env` and run `pnpm --filter web db:migrate-deploy` only when you accept touching production data.
- **After SQLite import:** `_prisma_migrations` is already populated; the Turso script applies nothing until a **new** migration lands in git.

## First production deploy sequence

1. Create a Turso DB and import data (WAL-ready file — [`scripts/prepare-sqlite-for-turso-import.sh`](../scripts/prepare-sqlite-for-turso-import.sh)).
2. Disable Vercel Preview deployments (see above).
3. Add **Production** env vars on Vercel → deploy `main` → smoke test (below).
4. If any user still has plaintext API keys in DB, run once against Turso:
   ```bash
   cd apps/web
   DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" ENCRYPTION_KEY="…" pnpm db:migrate-keys
   ```
5. Keep a SQLite backup until production is verified.

## Smoke test after deploy

```bash
curl -fsS "https://YOUR_PRODUCTION_HOST/backend/health"
```

Expect JSON `{ "ok": true }`.

- Register or log in with migrated user
- **Settings → Environment** — saved OpenAI/Cursor key still works (encryption key correct)
- One short AI action (e.g. verdict) and resume export if you rely on long routes (confirms timeout config)

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Build fails with P1012 (`URL must start with file:`) | Outdated build script — production build must use Turso migrate script when `DATABASE_URL` is `libsql://` |
| Build fails during Turso migrate script | Wrong `DATABASE_URL` / `TURSO_AUTH_TOKEN`; SQL error in a new migration; checksum mismatch if migration folder was edited after apply |
| Build fails on `prisma migrate deploy` (CI / local file URL) | Wrong `DATABASE_URL`; migration history mismatch vs database |
| 500 on every `/backend/*` with `PUBLIC_DEPLOY` message | Weak `JWT_SECRET`, missing `ENCRYPTION_KEY`, or `TRUST_PROXY` not `true` |
| AI calls fail after Turso import | `ENCRYPTION_KEY` on Vercel ≠ key used when keys were saved in SQLite |
| AI/resume times out at 60s | Plan limit; confirm `export const maxDuration = 300` in the backend catch-all route |
| Turso import rejected | SQLite not `journal_mode=WAL` — run prepare script |
| Unwanted Preview URLs | Re-disable Preview Deployments under Vercel Git settings |

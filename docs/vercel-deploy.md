# Vercel deployment (Turso)

**Deployment model:** two environments only — **local development** (SQLite file, `pnpm dev`, no Docker required) and **Vercel Production** (Turso). There is no Vercel Preview / staging deployment.

Related: [`technology.md`](./technology.md) (architecture), [`ci-cd.md`](./ci-cd.md), [`vercel.json`](../vercel.json), [`.env.example`](../.env.example).

## Vercel project settings

| Setting | Value |
| --- | --- |
| **Root Directory** | **`.`** (repository root — single Next.js package) |
| **Framework Preset** | Next.js (also set in [`vercel.json`](../vercel.json)) |
| **Install Command** | `pnpm install --frozen-lockfile` |
| **Build Command** | `pnpm build` (runs `prisma generate`, `prisma migrate deploy`, then `next build` via [`build-web.ts`](../scripts/build-web.ts)) |
| **Node.js** | 20.x (match `engines`) |
| **Production Branch** | `main` (or your chosen production branch) |

After changing **Root Directory** from `apps/web` to `.`, clear any overridden Install/Build commands in **Vercel → Settings → Build & Development** so [`vercel.json`](../vercel.json) values apply (or set them to match the table).

### Disable Preview deployments

In **Vercel → Project → Settings → Git**:

- Turn off **Preview Deployments** for pull requests and/or non-production branches (wording varies by Vercel UI version).

Only **Production** builds should run. Pull requests are still validated by **GitHub Actions** ([`ci-cd.md`](./ci-cd.md)); they do not need a Vercel Preview URL.

[`src/app/backend/[...path]/route.ts`](../src/app/backend/[...path]/route.ts) exports **`maxDuration = 300`** (App Router segment config). Vercel’s root `vercel.json` `functions` globs do not apply to `app/**/route.ts`, so duration is configured in the route file only. Long AI/resume routes need a **Vercel plan** that allows 300s serverless duration (Pro or equivalent).

## Environment variables (Production only)

Set these in **Vercel → Project → Settings → Environment Variables** and scope them to **Production** only (do not duplicate for Preview).

| Variable | Example / notes |
| --- | --- |
| `DATABASE_URL` | `libsql://your-db-name-org.turso.io` from `turso db show <name> --url` |
| `TURSO_AUTH_TOKEN` | From `turso db tokens create <name>` |
| `JWT_SECRET` | Min **32** chars; not `change-me*` (see `deploy-config.ts`) |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` — required for stored user API keys |
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
| `RATE_LIMIT_*` | see `src/server/lib/rate-limit.ts` | Override rate limits |
| `NEXT_TELEMETRY_DISABLED` | — | `1` to disable Next telemetry (CI already sets this) |

### Local development (not Vercel)

Use [`.env`](../.env) (from [`.env.example`](../.env.example)):

- `DATABASE_URL="file:./dev.db"` (on disk: `prisma/dev.db`)
- `JWT_SECRET` — weak default OK
- **Do not** set `PUBLIC_DEPLOY` locally unless testing hardening
- **Do not** set `TURSO_*` for normal local dev

The repository does **not** include scripts to export production Turso into local SQLite or to push SQLite files into Turso. Refresh local data with [`pnpm db:backup`](../package.json) / restore, or your own operator workflow outside this repo.

## Local vs Production

| Concern | Local (`pnpm dev`) | Vercel Production |
| --- | --- | --- |
| Database | SQLite `prisma/dev.db` | Turso (`libsql://` + token) |
| Migrations | `pnpm db:migrate` (author) / `pnpm db:migrate-deploy` (apply pending) | `prisma migrate deploy` on production build |
| Secrets | Dev defaults in `.env` | Strong secrets on Vercel (Production scope) |
| `PUBLIC_URL` | Not required | Production custom domain |

## Schema migrations on Turso

Production schema updates use **only** committed Prisma migrations applied at deploy time:

1. **Author locally:** `pnpm db:migrate` against `file:./dev.db` (`prisma/dev.db`).
2. **Before merging to `main`:** GitHub Actions runs `pnpm build`, which includes `prisma migrate deploy` against ephemeral SQLite (`file:./ci-build.db`).
3. **On merge / production deploy:** Vercel runs the same [`scripts/build-web.ts`](../scripts/build-web.ts) with Production `DATABASE_URL` + `TURSO_AUTH_TOKEN`, so `prisma migrate deploy` applies pending migrations to **production Turso**.

Do **not** run ad-hoc SQL or custom migrate scripts against production Turso from this repository.

## First production deploy sequence

1. Provision a Turso database and initial data outside this repo (Turso dashboard / CLI — not scripted here).
2. Disable Vercel Preview deployments (see above).
3. Set Vercel **Root Directory** to `.` and add **Production** env vars → deploy `main` → smoke test (below).
4. If any user still has plaintext API keys in DB, run once with production credentials: `pnpm db:migrate-keys` (operator laptop; not part of the Vercel build).

## Smoke test after deploy

```bash
curl -fsS "https://YOUR_PRODUCTION_HOST/backend/health"
```

Expect JSON `{ "ok": true }`.

- Register or log in
- **Settings → Environment** — saved OpenAI/Cursor key still works (`ENCRYPTION_KEY` correct)
- One short AI action (e.g. verdict) and resume export if you rely on long routes (confirms timeout config)

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Build fails during `prisma migrate deploy` | Wrong `DATABASE_URL` / `TURSO_AUTH_TOKEN`; SQL error in a new migration; checksum mismatch if a migration folder was edited after apply |
| 500 on every `/backend/*` with `PUBLIC_DEPLOY` message | Weak `JWT_SECRET`, missing `ENCRYPTION_KEY`, or `TRUST_PROXY` not `true` |
| AI calls fail after deploy | Wrong or rotated `ENCRYPTION_KEY` for ciphertext already in the database |
| AI/resume times out at 60s | Plan limit; confirm `export const maxDuration = 300` in the backend catch-all route |
| “No Next.js version detected” on build | Root Directory must be `.` (repo root); ensure `next` is in root `package.json` |
| Unwanted Preview URLs | Re-disable Preview Deployments under Vercel Git settings |

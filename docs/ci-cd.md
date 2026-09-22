# CI/CD

JoHEL uses **GitHub Actions** for continuous integration and **Vercel Git integration** for continuous delivery (Preview + Production). Operators on **Docker** get a CI `docker build` verify on `main` and when Docker files change on PRs.

Related: [`vercel-deploy.md`](./vercel-deploy.md), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), plan [`plans/2026-09-22-cicd-pipeline.md`](./plans/2026-09-22-cicd-pipeline.md) (Phase 94).

## Continuous integration (GitHub Actions)

Workflow **CI** runs on every pull request and on pushes to `main` / `master`.

| Job | What it checks |
| --- | --- |
| **web** | Prisma generate, Vitest (`apps/web`), ESLint, `next build` with ephemeral SQLite (`DATABASE_URL=file:./prisma/ci-build.db`) — no Turso secrets |
| **packages** | Vitest for `@johel/resume` and `@johel/jd-meta` |
| **docker** | `docker buildx build` for `linux/arm64` (matches root `Dockerfile`) on pushes to `main`/`master`, or on PRs that touch `Dockerfile`, compose files, `docker-entrypoint.sh`, or `.dockerignore` |

Local equivalent:

```bash
pnpm install
pnpm test          # web + workspace package tests
pnpm --filter web lint
pnpm --filter web build   # set DATABASE_URL / JWT_SECRET like CI if needed
```

CI uses **concurrency** to cancel in-progress runs on the same branch when new commits are pushed.

## Continuous delivery (Vercel)

| Environment | Trigger | Database |
| --- | --- | --- |
| **Preview** | PR / branch deploy (project linked to GitHub) | Staging Turso (recommended) |
| **Production** | Merge to production branch (`main`) | Production Turso |

Build command runs [`apps/web/scripts/build-web.ts`](../apps/web/scripts/build-web.ts): `prisma generate`, then **Turso** [`migrate-deploy-turso.ts`](../apps/web/scripts/migrate-deploy-turso.ts) when `DATABASE_URL` is remote libSQL, otherwise `prisma migrate deploy` (as in CI). See [`vercel-deploy.md`](./vercel-deploy.md) for the full env checklist.

**Migration policy:** Ship backward-compatible Prisma migrations on `main`. Validate on a **Preview** build (PR) so the Turso migrate script runs against staging before production. Breaking schema changes need a documented maintenance window or expand → deploy → contract release.

**Rollback**

| Layer | Action |
| --- | --- |
| Application | Vercel → Deployments → **Promote** a previous production deployment |
| Database | No automatic down-migration; restore Turso from backup or ship a forward-fix migration |
| Secrets | Changing `JWT_SECRET` ends sessions; changing `ENCRYPTION_KEY` without re-encrypting breaks stored user API keys |

## Branch protection (repository settings)

On the production branch (`main`), enable in **GitHub → Settings → Branches**:

- Require a pull request before merging
- Require status checks **web** and **packages** (job names from the CI workflow)
- Optionally require branches to be up to date before merge
- Restrict direct pushes to `main`

Vercel deployment success is separate; treat a green Preview build as part of your merge checklist for schema or env-sensitive changes.

## Post-deploy smoke

After Preview or Production deploy:

```bash
curl -fsS "https://YOUR_DEPLOYMENT_HOST/backend/health"
# Expect: {"ok":true}
```

Full manual checklist: login, Settings API key, one short AI action — [`vercel-deploy.md` § Smoke test](./vercel-deploy.md#smoke-test-after-deploy).

Automated Preview health checks in GitHub Actions are **out of scope** for Phase 94 (Playwright/E2E remains deferred).

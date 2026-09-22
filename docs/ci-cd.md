# CI/CD

JoHEL uses **GitHub Actions** for continuous integration and **Vercel Git integration** for **production** delivery only. There is no Vercel Preview environment; operators validate changes via CI on pull requests, then merge to `main` to deploy production.

Related: [`vercel-deploy.md`](./vercel-deploy.md), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), plan [`plans/2026-09-22-cicd-pipeline.md`](./plans/2026-09-22-cicd-pipeline.md) (Phase 94).

## Environments

| Environment | Where | Database |
| --- | --- | --- |
| **Local development** | `pnpm dev` on a developer machine | SQLite `file:./prisma/dev.db` |
| **Production** | Vercel (production branch, typically `main`) | Turso (`libsql://` + `TURSO_AUTH_TOKEN` on Vercel) |

Docker files remain in the repo for optional self-hosted/LAN use ([`docker.md`](./docker.md)); they are **not** built in GitHub Actions.

## Continuous integration (GitHub Actions)

Workflow **CI** runs on every pull request and on pushes to `main` / `master`.

| Job | What it checks |
| --- | --- |
| **ci** | Prisma generate, Vitest (app + inlined `src/packages/*`), ESLint, `next build` with ephemeral SQLite (`DATABASE_URL=file:./prisma/ci-build.db`) — no Turso secrets |

Local equivalent:

```bash
pnpm install
pnpm test
pnpm lint
pnpm build   # set DATABASE_URL / JWT_SECRET like CI if needed
```

CI uses **concurrency** to cancel in-progress runs on the same branch when new commits are pushed.

**CI is the merge gate** — require the **ci** status check on `main` (see [Branch protection](#branch-protection-repository-settings)). A green PR run is what blocks bad merges.

### Optional local pre-push (Husky)

After `pnpm install`, Husky installs a **pre-push** hook that runs `pnpm typecheck` (`prisma generate` + `next build` with the same minimal env as CI). It catches TypeScript / Next compile errors (e.g. invalid API path unions) before you push; it does **not** run Vitest, ESLint, or `prisma migrate deploy` — only GitHub Actions does the full pipeline.

| Command | When |
| --- | --- |
| `pnpm typecheck` | Pre-push hook (or run manually) |
| `pnpm build` | Full local CI build step (includes migrations via [`scripts/build-web.ts`](../scripts/build-web.ts)) |
| `SKIP_PREPUSH_CHECKS=1 git push` | Bypass the hook once (`git push --no-verify` also works) |

## Continuous delivery (Vercel Production)

| Trigger | What happens |
| --- | --- |
| Merge (or push) to **production branch** (`main`) | Vercel Production build → Turso migrate script → deploy live app |

Disable **Preview Deployments** in Vercel Git settings so PRs do not create branch deployments ([`vercel-deploy.md`](./vercel-deploy.md)).

Production build runs [`scripts/build-web.ts`](../scripts/build-web.ts): `prisma generate` → [`migrate-deploy-turso.ts`](../scripts/migrate-deploy-turso.ts) → `next build`.

**Migration policy:** Ship backward-compatible Prisma migrations on `main`. CI proves they apply to SQLite before merge; the production Vercel build applies pending SQL to **production Turso**. Breaking schema changes need a documented maintenance window or expand → deploy → contract release.

**Rollback**

| Layer | Action |
| --- | --- |
| Application | Vercel → Deployments → **Promote** a previous production deployment |
| Database | No automatic down-migration; restore Turso from backup or ship a forward-fix migration |
| Secrets | Changing `JWT_SECRET` ends sessions; changing `ENCRYPTION_KEY` without re-encrypting breaks stored user API keys |

## Branch protection (repository settings)

On the production branch (`main`), enable in **GitHub → Settings → Branches**:

- Require a pull request before merging
- Require status check **ci** (job name from the CI workflow)
- Optionally require branches to be up to date before merge
- Restrict direct pushes to `main`

A green **ci** run is the pre-merge gate; production Vercel success confirms the live deploy after merge.

## Post-deploy smoke

After a production deploy:

```bash
curl -fsS "https://YOUR_PRODUCTION_HOST/backend/health"
# Expect: {"ok":true}
```

Full manual checklist: login, Settings API key, one short AI action — [`vercel-deploy.md` § Smoke test](./vercel-deploy.md#smoke-test-after-deploy).

Automated post-deploy checks in GitHub Actions are **out of scope** for Phase 94 (Playwright/E2E remains deferred).

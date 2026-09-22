# JoHEL

Local customized Resume / CV builder.

**Concept:** one Profile + Shared Experiences + one Workflow → Job Description → Filtering → Review → Decision → Generate. Each user can manage multiple profiles, shared hands-on experiences, and multiple workflows. Details in [docs/specification.md](docs/specification.md).

## Docs

- [Specification](docs/specification.md)
- [Technology](docs/technology.md)
- [CI/CD](docs/ci-cd.md)
- [Vercel deployment](docs/vercel-deploy.md)
- [Docker deployment](docs/docker.md) (legacy self-hosted; production target is Vercel + Turso)
- [Plans](docs/plans/)

## Run locally

```bash
pnpm install
cp apps/web/.env.example apps/web/.env   # first time
pnpm db:migrate                          # first time / after schema changes
pnpm dev:web                             # http://127.0.0.1:4041
```

Open `http://127.0.0.1:4041` — register or log in. The UI and API share one Next.js process; browser calls go to `/backend/*`.

## Production (Vercel + Turso)

See **[docs/vercel-deploy.md](docs/vercel-deploy.md)** for Production environment variables, disabling Preview deployments, and smoke tests.

- Set `DATABASE_URL` (`libsql://…`), `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `ENCRYPTION_KEY`, `PUBLIC_DEPLOY=true`, `TRUST_PROXY=true`, and `PUBLIC_URL` on Vercel (**Production** scope only).
- Production build runs [`apps/web/scripts/build-web.ts`](apps/web/scripts/build-web.ts) (Turso migrations + `next build`).
- Migrate existing SQLite data: backup → [`scripts/prepare-sqlite-for-turso-import.sh`](scripts/prepare-sqlite-for-turso-import.sh) → `turso db import`. Details in [`docs/technology.md`](docs/technology.md).

## Run with Docker Desktop (optional / LAN)

One Next.js image with SQLite on a volume. See **[docs/docker.md](docs/docker.md)**.

```bash
cp .env.example .env   # set JWT_SECRET
docker compose up -d --build
```

Open `http://127.0.0.1:4321` or `http://<host-lan-ip>:4321` from other devices on the LAN.

To rebuild after config changes, use `docker compose up -d --build --force-recreate`. Do **not** use `docker compose down -v` — that deletes the `johel-data` volume and your database.

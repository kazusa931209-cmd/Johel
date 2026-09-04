# JoHEL

Local customized Resume / CV builder.

**Concept:** one Profile + Shared Experiences + one Workflow → Job Description → Filtering → Review → Decision → Generate. Each user can manage multiple profiles, shared hands-on experiences, and multiple workflows. Details in [docs/specification.md](docs/specification.md).

## Docs

- [Specification](docs/specification.md)
- [Technology](docs/technology.md)
- [Plans](docs/plans/)

## Run locally

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # first time
cp apps/web/.env.example apps/web/.env.local   # first time
pnpm db:migrate                          # first time / after schema changes
pnpm dev:api                             # http://127.0.0.1:4042
pnpm dev:web                             # http://127.0.0.1:4041
```

Open `http://127.0.0.1:4041` — register or log in. Browser calls go to `/backend/*`, rewritten to the API.

# Phase 3 — Frontend Architecture

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Establish the local web UI structure so users can register, log in, and reach an authenticated app shell. Feature screens deferred.

## Architecture

- Package: `apps/web` — Next.js App Router + Tailwind CSS
- Same-origin proxy: `/backend/:path*` → `http://127.0.0.1:3001/:path*`
- Route groups: `(auth)` login/register; `(app)` session-gated shell + home
- Auth via existing Hono endpoints through the proxy; JWT httpOnly cookie on UI origin

## Outcomes

- Frontend scaffolded and verified (register/login/me/logout via `/backend`)
- Docs updated in `docs/technology.md`
- Phase 3 marked finished in `docs/specification.md`

## Out of scope

- JD / resume / API keys flows
- Playwright/Vitest
- Phase 4

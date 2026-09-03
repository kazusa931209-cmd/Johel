# Technology

Crucial and important technical handling for this project is documented here.

Product requirements and feature specifications belong in [`specification.md`](./specification.md), not in this file.

## Operational cost constraint

The stack must run with **no paid operational SaaS**. Local deployment only. LLM usage is billed only through **user-owned API keys**; the application itself does not require a paid third-party account to operate.

## Approved stack

Phase 1 approved a Next.js monolith. **Phase 2** introduced a standalone Hono API. **Phase 3** scaffolds the Next.js + Tailwind frontend as UI-only.

| Layer | Choice | Why |
| --- | --- | --- |
| Language / runtime | TypeScript on Node.js (LTS) | Single language for UI and API; fits Cursor SDK TypeScript package |
| API | **Hono** (standalone process) | Local API separate from UI; lightweight TypeScript server |
| UI | Next.js (App Router) + Tailwind CSS | Frontend only; no paid UI SaaS |
| Database | SQLite via Prisma | On-disk multi-user data; no hosted DB cost |
| Auth | Email + password on the **API**; JWT in httpOnly cookie | Multi-user local login; no Auth.js / OAuth IdP |
| Secrets / API keys | Per-user **plaintext** `Setting.apiKey` (Phase 5) | Masked on read; encrypt later if needed |
| LLM (later) | Provider interface; `@cursor/sdk` first | Matches spec; OpenAI / Anthropic adapters later |
| JD ingest (later) | Manual / URL (`fetch` + cheerio) / file (`pdf-parse`, `mammoth`) | No scraping or parse SaaS |
| Resume export (later) | `docx`; `@react-pdf/renderer` or `pdf-lib` | Server-side generation on the API |
| Templates / formats (later) | Natural-language settings in SQLite via LLM prompts | Spec requirement |
| Package manager | pnpm workspaces | Monorepo (`apps/api`, `apps/web`) |
| Testing (later) | Vitest + Playwright | Unit / e2e when that work begins |

## Architecture sketch

```text
User browser (:4041)
    → Next.js UI (apps/web)
        → rewrite /backend/* → Hono API (:4042)
            → Email/password + JWT (httpOnly cookie on UI origin)
            → SQLite (Prisma)
            → LLM / export / JD ingest (later)
```

## API (Phase 2)

- Package: `apps/api`
- Listen: `http://127.0.0.1:4042`
- Env: `DATABASE_URL`, `JWT_SECRET` (see `apps/api/.env.example`)
- Endpoints: `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /settings`, `PUT /settings`
- Prisma `User`: `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`
- Prisma `Setting` (one per user): `id`, `userId`, `provider`, `apiKey`, `createdAt`, `updatedAt`

## Frontend (Phase 3)

- Package: `apps/web`
- Listen: `http://127.0.0.1:4041`
- Same-origin proxy: Next.js rewrite `/backend/:path*` → `http://127.0.0.1:4042/:path*`
- Client calls `/backend/...` with `credentials: "include"` so the JWT cookie is set on the UI origin
- Route groups:
  - `(auth)` — `/login`, `/register`
  - `(app)` — authenticated shell + placeholder home `/`
- Session gate: client checks `GET /backend/auth/me` before rendering app routes

## Studio shell (Phase 4)

- Layout: top bar + left sidebar + main content (full-height studio chrome)
- Components: `StudioHeader`, `StudioSidebar`; theme via `ThemeProvider` + `johel-theme` in `localStorage`
- Theme: default `dark` on `<html class="dark">`; Settings page toggles Dark / Light
- Toast: top-center; variants success / warning / error / info with theme-aware bg and text tokens (`ToastProvider`). Any user action that calls the API must report the result with a toast.
- Routes (authenticated):
  - `/` — Workspace
  - `/settings` — Settings (theme + AI Agent)
  - `/profile` — Profile (email display)
- User menu: Profile, Sign out
- Sidebar: Workspace, Settings

## AI Agent settings (Phase 5)

- Provider id: `cursor` (UI label: Cursor AI Agent)
- `GET /settings` → `{ provider, apiKeyMasked }` or both `null` if unset
- `PUT /settings` → `{ provider: "cursor", apiKey }` (min 8 chars); upsert; returns `{ provider, apiKeyMasked }`
- Mask derived at read time: first 4 + ` ******** ` + last 4 (e.g. `4F28 ******** 3429`)
- Full `apiKey` is stored plaintext in SQLite; never returned to the client

## Plans

Built Cursor plans for completed work are archived under [`docs/plans/`](./plans/) with a `YYYY-MM-DD-` filename prefix.

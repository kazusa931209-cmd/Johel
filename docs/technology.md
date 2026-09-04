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
| LLM | Provider interface; `@cursor/sdk` first (installed in `apps/api`) | Matches Settings Cursor provider; OpenAI / Anthropic adapters later |
| JD ingest (later) | Manual / URL (`fetch` + cheerio) / file (`pdf-parse`, `mammoth`) | No scraping or parse SaaS |
| Resume export (later) | `docx`; `@react-pdf/renderer` or `pdf-lib` | Server-side generation on the API |
| Templates / formats (later) | Natural-language settings in SQLite via LLM prompts | Spec requirement |
| Package manager | pnpm workspaces | Monorepo (`apps/api`, `apps/web`) |
| Testing | Vitest (+ Playwright later) | Unit tests for Noise Filter; e2e when that work begins |

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
- Endpoints: `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /settings`, `PUT /settings`, `GET/POST /workflows`, `GET/PUT/DELETE /workflows/:id`, `GET/POST /profiles`, `GET/PUT/DELETE /profiles/:id`, `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`, `GET/POST /experiences`, `GET/PUT/DELETE /experiences/:id`, `POST /ai-filter`, `GET /ai-usage/summary`
- Prisma `User` → table `users`: `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`
- Prisma `Setting` → table `settings` (one per user): `id`, `userId`, `provider`, `apiKey`, `createdAt`, `updatedAt`
- Prisma `Workflow` → table `workflows` (per user): `id`, `userId`, `name`, `description?`, `language`, `filteringPrompt`, `createdAt`, `updatedAt` (no `usedCount`, no `metadataJson`)
- Prisma `WorkflowMetadata` → table `workflowMetadata`: `id`, `workflowId`, `key`, `rulePrompt?`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowId, key)`; cascade delete with workflow
- Prisma `Profile` → table `profiles` (per user): `id`, `userId`, `firstName`, `lastName`, `birthDate?` (`YYYY-MM-DD`), `email?`, `pn?`, `residence?`, `education?`, `createdAt`, `updatedAt`
- Prisma `ProfileLink` → table `profileLinks`: `id`, `profileId`, `key`, `link?`, `sortOrder`, `createdAt`, `updatedAt`; unique `(profileId, key)`; cascade delete with profile
- Prisma `Company` → table `companies` (per user): `id`, `userId`, `name`, `description`, `priority` (1-based integer), `createdAt`, `updatedAt`
- Prisma `CompanyMetadata` → table `companyMetadata`: `id`, `companyId`, `key`, `value`, `sortOrder`, `createdAt`, `updatedAt`; unique `(companyId, key)`; cascade delete with company
- Prisma `Experience` → table `experiences` (per user): `id`, `userId`, `category`, `description`, `createdAt`, `updatedAt`
- Prisma `ExperienceMetadata` → table `experienceMetadata`: `id`, `experienceId`, `key`, `value`, `sortOrder`, `createdAt`, `updatedAt`; unique `(experienceId, key)`; cascade delete with experience
- Prisma `AiUsage` → table `aiUsage` (per user): `id`, `userId`, `aiProvider`, `inputToken`, `outputToken`, `input`, `output`, `createdAt`
- SQLite table names are case-insensitive, so PascalCase (`User`) cannot be renamed to single-word camelCase (`user`). Tables use plural / compound camelCase: `users`, `settings`, `workflows`, `workflowMetadata`, `profiles`, `profileLinks`, `companies`, `companyMetadata`, `experiences`, `experienceMetadata`, `aiUsage`
- **Convention:** all physical table names are camelCase via Prisma `@@map` (never PascalCase table names)

## Frontend (Phase 3)

- Package: `apps/web`
- Listen: `http://127.0.0.1:4041`
- Same-origin proxy: Next.js rewrite `/backend/:path*` → `http://127.0.0.1:4042/:path*`
- Client calls `/backend/...` with `credentials: "include"` so the JWT cookie is set on the UI origin
- Route groups:
  - `(auth)` — `/login`, `/register`
  - `(app)` — authenticated shell + placeholder home `/`
- Session gate: client checks `GET /backend/auth/me` before rendering app routes
- If a frontend component file exceeds **500 lines**, ask the user before growing it further; prefer splitting into smaller components/hooks
- Action controls: `AddButton` (plus), `EditButton` (pencil), `DeleteButton` (red trash), `CloseButton` (X) in `components/shared/action-icon-buttons.tsx`
- Dialogs use `DetailDialog` (`components/shared/detail-dialog.tsx`) so Close (X) is always in the top-right header; the footer holds only the main action (Apply / Delete). Do not put Close beside that action. Optional `dismissOnBackdrop={false}` blocks outer-click dismiss (used by AI Filter result dialog).

## Studio shell (Phase 4)

- Layout: top bar + left sidebar + main content (full-height studio chrome)
- Components: `components/app/StudioHeader`, `components/app/StudioSidebar`; theme via `ThemeProvider` + `johel-theme` in `localStorage`
- Theme: default `dark` on `<html class="dark">`; Settings page toggles Dark / Light
- Toast: top-center; variants success / warning / error / info with theme-aware bg and text tokens (`components/app/ToastProvider`). Any user action that calls the API must report the result with a toast.
- Routes (authenticated):
  - `/` — Workspace / Generate
  - `/profiles` — Workspace / Profiles
  - `/companies` — Workspace / Companies
  - `/experiences` — Workspace / Experiences
  - `/workflows` — Workspace / Workflows
  - `/settings` — Settings (theme + AI Agent)
  - `/profile` — account Profile (email display; distinct from Workspace Profiles)
- User menu: Profile, Sign out
- Header also shows `Token Used: {formatTokenUsed(n)}` beside the email; raw count is the user’s aggregated `aiUsage` total (`inputToken + outputToken`)
- Sidebar: Workspace (submenus Profiles, Companies, Experiences, Workflows, Generate — always open), Settings

## AI Agent settings (Phase 5)

- Provider id: `cursor` (UI label: Cursor AI Agent)
- `GET /settings` → `{ provider, apiKeyMasked }` or both `null` if unset
- `PUT /settings` → `{ provider: "cursor", apiKey }` (min 8 chars); upsert; returns `{ provider, apiKeyMasked }`
- Mask derived at read time: first 4 + ` ******** ` + last 4 (e.g. `4F28 ******** 3429`)
- Full `apiKey` is stored plaintext in SQLite; never returned to the client

## Workflows (Phase 6–7)

- `GET /workflows?q=&page=` — page size 10; lean list items (no metadata / filteringPrompt)
- Each list item includes `used` from a **post-query aggregation** by `workflowId` (not stored on `Workflow`). No usage rows yet → `used` is 0.
- `GET /workflows/:id` — full detail for the editor (owner only)
- `POST /workflows` / `PUT /workflows/:id` — `{ name, description?, language, filteringPrompt, metadata }`; on write, delete existing `workflowMetadata` rows for the workflow and insert the submitted list
- Language codes: `en`, `ja`, `zh-TW`, `zh-CN`, `ko` (default `en`)
- Metadata lives in `workflowMetadata` (not `metadataJson`); keys unique per workflow; rulePrompt max 1024
- Default filtering prompt text (Use Default): `Keep only Job & Job post company information`
- Filtering prompt placeholder: `Process and filter the Job Description.`
- Web routes: `/workflows` list; `/workflows/new` add; `/workflows/[id]/edit` edit; editor has back beside title; footer Cancel/Save persist the whole workflow; metadata edits are local until Save

## Profiles (Phase 8)

- `GET /profiles?q=&page=` — page size 10; list includes `links` for the Links column
- `GET /profiles/:id` — full detail for the editor (owner only)
- `POST /profiles` / `PUT /profiles/:id` — `{ firstName, lastName, birthDate?, email?, pn?, residence?, education?, links }`; on write, delete existing `profileLinks` and insert the submitted list
- Search `q` across firstName, lastName, email, pn, residence, education
- Links: `{ key, link | null }`; keys unique per profile
- Web routes: `/profiles` list; `/profiles/new` add; `/profiles/[id]/edit` edit; Links UX mirrors workflow Metadata

## Companies (Phase 9)

- `GET /companies?q=&page=` — page size 10; list includes `metadata` for the Metadata column and `nextPriority` (max existing priority for the user + 1, or 1)
- List order: `priority` ascending, then `name` ascending
- `GET /companies/:id` — full detail for the editor (owner only)
- `POST /companies` / `PUT /companies/:id` — `{ name, description, priority?, metadata }`; on write, delete existing `companyMetadata` and insert the submitted list
- If `priority` is omitted on create, the API assigns `nextPriority`; on update, omitted priority keeps the existing value
- Search `q` across name and description
- Metadata: `{ key, value }`; keys unique per company; value is a string (may be empty)
- Web routes: `/companies` list; `/companies/new` add; `/companies/[id]/edit` edit; Metadata UX mirrors workflow Metadata

## Experiences (Phase 10)

- `GET /experiences?q=&page=` — page size 10; list includes `metadata` for the Metadata column
- List order: `updatedAt` descending
- `GET /experiences/:id` — full detail for the editor (owner only)
- `POST /experiences` / `PUT /experiences/:id` — `{ category, description, metadata }`; on write, delete existing `experienceMetadata` and insert the submitted list
- Search `q` across category and description
- Metadata: `{ key, value }`; keys unique per experience; value is a string (may be empty)
- Web routes: `/experiences` list; `/experiences/new` add; `/experiences/[id]/edit` edit; Metadata UX mirrors company Metadata

## Generate UI (Phase 11–14)

- Route `/` gates on existing list totals: at least one profile, company, experience, and workflow; otherwise a centered alert with links (not a toast)
- Timeline steps: Job → PCEW → Verdict → Company → Generate (Job and PCEW interactive; later steps are placeholders)
- Job UI: Manual / URL / File tabs; Manual has Job text max 10,000 chars, Noise Filter, AI Filter, Rollback; URL and File tabs show an info alert (“not implemented yet / coming soon”) instead of inputs
- AI Filter **Next** accepts the Markdown result and sets `activeStep` to PCEW
- PCEW: four `PcewSection` tables (profile single-select; companies multi-select; experiences multi-select; workflow single-select); loads all items via list APIs with `page=null` (or `limit=null`); checkbox column instead of row numbers; row click selects/toggles; `ViewButton` (eye icon) opens existing read-only detail dialogs; `validatePcewSelection` on Next; selection kept in page state (`PcewSelection`: `profileId`, `companyIds[]`, `experienceIds[]`, `workflowId`)
- List APIs (`GET /profiles`, `/companies`, `/experiences`, `/workflows`): `page=null` or `limit=null` returns all matching items; default pagination unchanged (`page` defaults to 1, page size 10)
- Token display: `formatTokenUsed` in `apps/web/src/lib/tokens.ts` — compact K/M/G/T with one decimal when needed (`0.3K`, `12.5K`, `0.6M`); header shows `Token Used: …` from `GET /ai-usage/summary`
- Components under `apps/web/src/components/generate/` (`GenerateJobStep`, `GeneratePcewStep`, `PcewSection`, `pcew-types`)

## AI Filter (Phase 13)

- `POST /ai-filter` — body `{ jobDescription }` (1–10,000 chars); requires saved Settings provider/apiKey; provider-specific system prompt; returns `{ markdown, usage, tokenUsed }`
- `GET /ai-usage/summary` — `{ tokenUsed }` = sum of `inputToken + outputToken` for the user
- Provider adapter under `apps/api/src/lib/ai-filter/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); prompt map keyed by provider
- Markdown-only output with sections `## Job` and `## Job post Company & contacts`; unknowns as `Not found`
- Web: fullscreen loading while AI Filter runs; `AiFilterResultDialog` renders Markdown with `react-markdown`; `DetailDialog` supports `dismissOnBackdrop={false}`; footer Discard (danger) / Retry / Next; `AiUsageProvider` refreshes header total after success

## Noise Filter (Phase 12)

- Module: `apps/web/src/lib/noise-filter/` — pure TypeScript, synchronous, no network / LLM / DB
- Public API: `noiseFilter(raw: string)` → `{ text, originalLength, currentLength, reductionRate, diagnostics }`
  - `reductionRate = (originalLength - currentLength) / originalLength` (0 when empty)
  - Each diagnostic: `{ filter, beforeLength, afterLength, removedLength }`
- Pipeline order: Normalize → HTML → Markdown → Boilerplate → Duplicate → Navigation → Section → **WalletAddress** → **DeJob** (+ optional extras)
- Filter contract: `{ name, apply(context): context }`
  - `createDefaultFilters()` — 7 core filters only
  - `createDefaultPluginFilters()` — WalletAddress + DeJob
  - `createNoiseFilterPipeline(extraFilters?)` — core + default plugins + extras
- Plugins under `plugins/`:
  - **WalletAddress** — strips full `0x`+40 hex and truncated forms (`0xfC5f...69Ad`)
  - **DeJob** — whole-line chrome via `dejob.config.ts` (View more jobs of … >, tagline regexp `DeJob Blazes New Trials for Web 3.0`, About Us / Find Job / etc.)
- Configurable patterns in `config.ts` (boilerplate, navigation exact lines, section headings, footer boundaries)
- Conservative / loss-aware: line-level and boundary-based removal; never global keyword nuking of technical terms
- HTML: `node-html-parser` when input looks like HTML; strip script/style/noscript/svg/canvas/iframe/template and comments; regex fallback on parse failure
- Compatibility: `apps/web/src/lib/jobNoiseFilter.ts` re-exports `JOB_TEXT_MAX` / `JOB_ROLLBACK_MAX` and `applyNoiseFilter` → `noiseFilter(input).text`
- Generate Job toast includes reduction % and before→after char counts (via `formatThousandsSeparated`)
- Tests: Vitest (`pnpm --filter web test`); per-filter unit tests + BIT / Golang Engineer regression fixture under `__tests__/`

## Plans

Built Cursor plans for completed work are archived under [`docs/plans/`](./plans/) with a `YYYY-MM-DD-` filename prefix.

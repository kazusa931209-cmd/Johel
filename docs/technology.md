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
| LLM | Provider interface; `@cursor/sdk` (Cursor) and `openai` SDK (OpenAI) in `apps/api` | User-owned keys; Anthropic adapters later |
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
- Endpoints: `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /settings`, `PUT /settings`, `GET /settings/process`, `PUT /settings/process`, `GET/POST /workflows`, `GET/PUT/DELETE /workflows/:id`, `GET/POST /profiles`, `GET/PUT/DELETE /profiles/:id`, `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`, `GET/POST /experiences`, `GET/PUT/DELETE /experiences/:id`, `POST /ai-verdict`, `POST /ai-resume`, `POST /ai-evaluate`, `POST /resume/docx`, `GET /ai-usage/summary`, `GET /prompts`, `PUT /prompts`
- Prisma `User` → table `users`: `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`
- Prisma `Setting` → table `settings` (one per user): `id`, `userId`, `provider`, `apiKey`, `createdAt`, `updatedAt`
- Prisma `Workflow` → table `workflows` (per user): `id`, `userId`, `profileId?` (FK → `profiles`), `name`, `description?`, `language`, `createdAt`, `updatedAt` (no `usedCount`, no `metadataJson`, no `verdictPrompt`)
- Prisma `WorkflowCompany` → table `workflowCompanies`: `id`, `workflowId`, `companyId`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowId, companyId)`; cascade delete with workflow
- Prisma `WorkflowExperience` → table `workflowExperiences`: `id`, `workflowId`, `experienceId`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowId, experienceId)`; cascade delete with workflow
- Prisma `Profile` → table `profiles` (per user): `id`, `userId`, `firstName`, `lastName`, `birthDate?` (`YYYY-MM-DD`), `email?`, `pn?`, `residence?`, `education?`, `createdAt`, `updatedAt`
- Prisma `ProfileLink` → table `profileLinks`: `id`, `profileId`, `key`, `link?`, `sortOrder`, `createdAt`, `updatedAt`; unique `(profileId, key)`; cascade delete with profile
- Prisma `Company` → table `companies` (per user): `id`, `userId`, `name`, `description`, `priority` (1-based integer), `createdAt`, `updatedAt`
- Prisma `CompanyMetadata` → table `companyMetadata`: `id`, `companyId`, `key`, `value`, `sortOrder`, `createdAt`, `updatedAt`; unique `(companyId, key)`; cascade delete with company
- Prisma `Experience` → table `experiences` (per user): `id`, `userId`, `category`, `description`, `createdAt`, `updatedAt`
- Prisma `ExperienceMetadata` → table `experienceMetadata`: `id`, `experienceId`, `key`, `value`, `sortOrder`, `createdAt`, `updatedAt`; unique `(experienceId, key)`; cascade delete with experience
- Prisma `AiUsage` → table `aiUsage` (per user): `id`, `userId`, `aiProvider`, `inputToken`, `outputToken`, `input`, `output`, `createdAt`
- Prisma `Prompt` → table `prompts` (one per user): `id`, `userId` (unique), `verdictPrompt`, `generatePrompt`, `evaluatePrompt`, `createdAt`, `updatedAt`
- Prisma `GenerationProcess` → table `generationProcess` (one per user): `id`, `userId` (unique), `doVerdict`, `doEvaluate`, `createdAt`, `updatedAt`; defaults both `true`
- SQLite table names are case-insensitive, so PascalCase (`User`) cannot be renamed to single-word camelCase (`user`). Tables use plural / compound camelCase: `users`, `settings`, `generationProcess`, `workflows`, ...
- **Convention:** all physical table names are camelCase via Prisma `@@map` (never PascalCase table names)

## Frontend (Phase 3)

- Package: `apps/web`
- Listen: `http://127.0.0.1:4041`
- Same-origin proxy: Next.js route handler `/backend/[...path]` → `API_ORIGIN` (default `http://127.0.0.1:4042`); proxy and client fetch timeout **300 seconds** (10× 30s baseline) via `apps/web/src/lib/api-timeout.ts`
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
  - `/prompts` — Workspace / Prompts
  - `/settings` — Settings (theme + AI Agent)
  - `/profile` — account Profile (email display; distinct from Workspace Profiles)
- User menu: Profile, Sign out
- Header also shows `Token Used: {formatTokenUsed(n)}` beside the email; raw count is the user’s aggregated `aiUsage` total (`inputToken + outputToken`)
- Sidebar: **Workspace** (Profiles, Companies, Experiences, Workflows, Prompts — always open), **Run** (Generate — always open), Settings; section labels use normal title case (not all caps)

## AI Agent settings (Phase 5, 21)

- Provider ids: `cursor` (UI label: Cursor AI Agent), `openai` (UI label: OpenAI)
- `GET /settings` → `{ provider, apiKeyMasked }` or both `null` if unset
- `PUT /settings` → `{ provider: "cursor" | "openai", apiKey }` (min 8 chars); upsert; returns `{ provider, apiKeyMasked }`
- One active provider + one API key per user in `settings`; switching provider requires saving that provider’s key
- Mask derived at read time: first 4 + ` ******** ` + last 4 (e.g. `4F28 ******** 3429`)
- Full `apiKey` is stored plaintext in SQLite; never returned to the client
- Web Settings: enabled provider dropdown; masked key shown only when the selected provider matches the saved provider; Save stays enabled with inline validation on submit; toast on API result

## Process settings (Phase 26)

- `GET /settings/process` → `{ doVerdict, doEvaluate }` (defaults both `true` when no row)
- `PUT /settings/process` → `{ doVerdict, doEvaluate }`; upsert by `userId`; returns saved values
- Web Settings **Process** section: **Do Verdict** and **Do Evaluate** checkboxes; Save always enabled; toast on API result
- Generate reads process settings on load; Verdict Prompt prerequisite only when `doVerdict`; Evaluate Prompt only when `doEvaluate`
- When `doVerdict` is false: Job **Next** skips `POST /ai-verdict`; Workflow hides verdict panel; `POST /ai-resume` receives `acceptedMarkdown: ""`
- When `doEvaluate` is false: timeline is Job → Workflow → Generate; Generate **Download** is last-step action; Evaluate step hidden; stored `activeStep: "Evaluate"` normalizes to Generate on load

## Workflows (Phase 6–7, 22)

- `GET /workflows?q=&page=` — page size 10; lean list items (name, description, used, dates)
- Each list item includes `used` from a **post-query aggregation** by `workflowId` (not stored on `Workflow`). No usage rows yet → `used` is 0.
- `GET /workflows/:id` — full detail for the editor (owner only): `profileId`, `companyIds[]`, `experienceIds[]`, plus scalar fields
- `POST /workflows` / `PUT /workflows/:id` — `{ name, description?, language, profileId, companyIds[], experienceIds[] }`; validates one profile, ≥1 company, ≥1 experience (all owned by user); on write, replaces `workflowCompanies` and `workflowExperiences` junction rows
- Language codes: `en`, `ja`, `zh-TW`, `zh-CN`, `ko` (default `en`)
- Web routes: `/workflows` list (table columns: No, Name, Description, Updated, actions); `/workflows/new` add; `/workflows/[id]/edit` edit; editor has name/description/language plus shared `WorkflowPcewPicker` (Profile single-select; Companies/Experiences multi-select via `PcewSection`)
- Generate Workflow step workflow table columns: Name, Description, Updated
- **Phase 22 migration note:** `workflowMetadata` dropped; existing workflows need profile/companies/experiences re-selected in the editor

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

## Generate UI (Phase 11–20, 22, 24, 25, 26, 27)

- Route `/` gates on at least one workflow and saved Generate Prompt; Verdict Prompt required only when `doVerdict`; Evaluate Prompt required only when `doEvaluate`; otherwise a centered alert with links (not a toast)
- Timeline steps: Job → Workflow → Generate, plus **Evaluate** when `doEvaluate` is true
- Sticky header: page title row includes **New** (plus icon + label) to reset the in-progress Generate session to a blank Job step; step row (`GenerateStepNavPrevButton` + `GenerateTimeline` + `GenerateStepNavNextButton`) uses `sticky top-0` with `-mt-6 pt-6` to cover main padding and prevent content showing through the gap above; `bg-background` and bottom border
- Step navigation: steps register handlers via `useRegisterGenerateStepNav`; large round controls flank the timeline on the same row
- Job UI (Manual): Job text max 10,000 chars + right **Next** only; URL and File tabs show an info alert (“not implemented yet / coming soon”)
- Job **Next**: inline validation if JD empty; client `noiseFilter()` runs silently (textarea unchanged); `POST /ai-verdict` with filtered text when `doVerdict` and inputs changed, or reuses stored verdict when `verdictInputKey` matches; fullscreen loading; on success saves `acceptedMarkdown` + `verdictInputKey`, refreshes header Token Used, toast, `activeStep` → Workflow; on error stays on Job
- Workflow: read-only **AI Verdict result** Markdown panel at top (`acceptedMarkdown`); then one `PcewSection` workflow table (single-select); loads all workflows via `GET /workflows` with `page=null`; **Next** runs `POST /ai-resume` with `{ jobDescription, acceptedMarkdown, workflowId }` (profile/companies/experiences resolved server-side from the workflow), or reuses stored resume when fingerprint unchanged
- Generate: `GenerateGenerateStep` renders `resumeToMarkdown(resume)` via `ResumeMarkdown`; **Previous** → Workflow; **Next** runs `POST /ai-evaluate` with noise-filtered `jobDescription` and stored `resume`, or reuses stored evaluation when fingerprint unchanged; fullscreen loading while evaluating; **Download** on this step when `doEvaluate` is false
- Evaluate: `GenerateEvaluateStep` renders evaluation Markdown via `AiVerdictMarkdown`; **Previous** → Generate; **Download** calls `POST /resume/docx` with stored JSON
- One Generate **process** spans Job through DOCX download; session persists after download until **New** or until Settings **Process** flags change (Do Verdict / Do Evaluate saved with different values)
- In-progress Generate run persisted in `sessionStorage` per user (`johel:generate-session:{userId}`): active timeline step, Job state, `workflow: { workflowId, workflowName? }`, `verdictInputKey`, `resume` JSON, `generationInputKey` fingerprint, `evaluationMarkdown`, and `evaluationInputKey`; legacy `pcew` session keys are parsed for `workflowId`; changing Job text clears verdict, resume, and evaluation; changing workflow clears resume and evaluation
- List APIs (`GET /workflows`, etc.): `page=null` or `limit=null` returns all matching items
- Token display: `formatTokenUsed` in `apps/web/src/lib/tokens.ts`; header from `GET /ai-usage/summary`
- Components under `apps/web/src/components/generate/` (`GenerateJobStep`, `GenerateWorkflowStep`, `GenerateGenerateStep`, `GenerateEvaluateStep`, `GenerateStepNav`, `PcewSection`, `pcew-types`); workflow editor uses `WorkflowPcewPicker`

## AI Verdict (Phase 13, 19)

- `POST /ai-verdict` — body `{ jobDescription }` (1–10,000 chars; client sends noise-filtered text); requires saved Settings provider/apiKey and non-empty `prompts.verdictPrompt`; system prompt = user Verdict Prompt + extraction rules; returns `{ markdown, usage, tokenUsed }`
- `GET /ai-usage/summary` — `{ tokenUsed }` = sum of `inputToken + outputToken` for the user; `sumTokenUsed` in `apps/api/src/lib/sum-token-used.ts`
- Provider adapter under `apps/api/src/lib/ai-verdict/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Markdown output sections (in order): `## Verdict` (each user question as `###` heading + answer paragraph or sub-bullet list), `## Job`, `## Job post Company & contacts`; unknowns as `Not found`
- Web: `runAiVerdict` in `apps/web/src/lib/api.ts`; Job step fullscreen loading; Workflow step renders result with `AiVerdictMarkdown` (`react-markdown` + `@tailwindcss/typography`); `AiUsageProvider` refreshes header total after success
- **Note:** Phase 13 introduced this as `POST /ai-filter`; Phase 19 renamed to `ai-verdict` and wired into Generate Job **Next**

## Prompts settings (Phase 18, 23)

- `GET /prompts` → `{ verdictPrompt: string, generatePrompt: string, evaluatePrompt: string }` — empty strings when no row yet (owner only)
- `PUT /prompts` → body `{ verdictPrompt, generatePrompt, evaluatePrompt }` (each trim, min 1, max 10,000 chars); upsert by `userId`; returns all three prompts
- Web route `/prompts`: Verdict Prompt, Generate Prompt, and Evaluate Prompt textareas; Save always enabled; inline validation on submit; toast on API result
- Legacy web route `/verdict` redirects to `/prompts`
- Client: `getPrompts`, `savePrompts` in `apps/web/src/lib/api.ts`; placeholders in `apps/web/src/lib/prompts.ts`
- Verdict Prompt consumed by `POST /ai-verdict`; Generate Prompt consumed by `POST /ai-resume`; Evaluate Prompt consumed by `POST /ai-evaluate`

## AI Resume (Phase 20, 22, 23)

- `POST /ai-resume` — body `{ jobDescription, acceptedMarkdown, workflowId }`; requires saved Settings provider/apiKey and non-empty `prompts.generatePrompt`; server loads the owned workflow (profile, companies, experiences via junction tables) and assembles generation input; system prompt = user Generate Prompt + shared resume rules; returns `{ resume, usage, tokenUsed }` where `resume` is validated `GeneratedResume` JSON
- Provider adapter under `apps/api/src/lib/ai-resume/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-terra`, reasoning `medium`, JSON output); response parsed as JSON only and validated with Zod from `@johel/resume`
- Web: `runAiResume` in `apps/web/src/lib/api.ts`; Workflow **Next** fullscreen loading; session stores `resume` + `generationInputKey`; Generate step renders Markdown; Evaluate step downloads DOCX without re-calling AI when inputs are unchanged

## AI Evaluate (Phase 25)

- `POST /ai-evaluate` — body `{ jobDescription, resume }` (`jobDescription` 1–10,000 chars noise-filtered text; `resume` validated `GeneratedResume`); requires saved Settings provider/apiKey and non-empty `prompts.evaluatePrompt`; system prompt = user Evaluate Prompt + provider output notes; server converts resume to Markdown via `resumeToMarkdown`; returns `{ markdown, usage, tokenUsed }`
- Provider adapter under `apps/api/src/lib/ai-evaluate/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Web: `runAiEvaluate` in `apps/web/src/lib/api.ts`; Generate **Next** fullscreen loading; session stores `evaluationMarkdown` + `evaluationInputKey` (same fingerprint as `generationInputKey`); Evaluate step renders result with `AiVerdictMarkdown`

## Resume package (`@johel/resume`, Phase 20)

- Workspace package: `packages/resume`
- Canonical model: `GeneratedResume` (Zod schema in `domain/generated-resume.ts`)
- `resumeToMarkdown(resume)` — deterministic Markdown for web display (main export)
- `buildResumeDocxFileName(resume, workflowName?, date?)` — `YYYY-MM-DD-{name}-{workflow}.docx` using sanitized segments and local calendar date
- `@johel/resume/docx` — `buildResumeDocxBuffer` / `buildResumeDocxBlob` (server/Node); section builders under `docx-builder/sections/` and `docx-builder/templates/default.ts`; shared `ResumeDocxStyle` in `docx-builder/styles.ts`
- `POST /resume/docx` — body `{ resume, workflowName? }` (validated `GeneratedResume`); returns `.docx` attachment named via `buildResumeDocxFileName`; used by Generate/Evaluate **Download**
- Consumed by API (validation), web (display + download), and Vitest unit tests
- **DOCX template management** — architecture, default template, style tokens, and extension guide: [`docx-template-management.md`](./docx-template-management.md)

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
- Compatibility: `apps/web/src/lib/jobNoiseFilter.ts` re-exports `JOB_TEXT_MAX` and `applyNoiseFilter` → `noiseFilter(input).text`
- Generate Job **Next** runs noise filter silently before `POST /ai-verdict` (no separate Noise Filter button)
- Tests: Vitest (`pnpm --filter web test`); per-filter unit tests + BIT / Golang Engineer regression fixture under `__tests__/`

## Plans

Built Cursor plans for completed work are archived under [`docs/plans/`](./plans/) with a `YYYY-MM-DD-` filename prefix.

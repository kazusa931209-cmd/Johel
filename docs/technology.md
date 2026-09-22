# Technology

Crucial and important technical handling for this project is documented here.

Product requirements and feature specifications belong in [`specification.md`](./specification.md), not in this file.

## Operational cost constraint

The stack must run with **no paid operational SaaS**. Deployment targets are **local/LAN** (Phase 33) and **public internet** (Phase 83, self-hosted HTTPS). LLM usage is billed only through **user-owned API keys**; the application itself does not require a paid third-party account to operate.

## Approved stack

Phase 1 approved a Next.js monolith. **Phase 2** introduced a standalone Hono API. **Phase 3** scaffolds the Next.js + Tailwind frontend as UI-only.

| Layer | Choice | Why |
| --- | --- | --- |
| Language / runtime | TypeScript on Node.js (LTS) | Single language for UI and API; fits Cursor SDK TypeScript package |
| API | **Next.js Route Handler** (`/backend/*`) + **Hono** router in-process | Single deployable app; same route logic as former standalone API |
| UI | Next.js (App Router) + Tailwind CSS | Frontend only; no paid UI SaaS |
| Database | **SQLite file** (local dev) / **Turso libSQL** (production on Vercel) via Prisma | Dev: `file:./prisma/dev.db`; prod: `libsql://` + `TURSO_AUTH_TOKEN` |
| Auth | Login ID + password on the **API**; JWT in httpOnly cookie | Multi-user local login; no Auth.js / OAuth IdP. API field `loginId`; DB column `users.email` stores the login ID (no email-format validation). |
| Secrets / API keys | Per-user `Setting.apiKey` — **AES-256-GCM at rest** when `ENCRYPTION_KEY` is set (Phase 83); plaintext only in local dev without the key | Masked on read; decrypt via `getUserAiSettings` |
| LLM | Provider interface; `@cursor/sdk` (Cursor) and `openai` SDK (OpenAI) in `src/server` | User-owned keys; Anthropic adapters later |
| JD ingest (later) | Manual / URL (`fetch` + cheerio) / file (`pdf-parse`, `mammoth`) | No scraping or parse SaaS |
| Resume export | `docx`; `pdf-lib` (PDF) | Server-side generation on the API |
| Templates / formats (later) | Natural-language settings in SQLite via LLM prompts | Spec requirement |
| Package manager | pnpm (single package at repo root) | Former `@johel/*` libraries live under `src/packages/*` with TypeScript path aliases |
| Testing | Vitest; GitHub Actions CI (Phase 83, Phase 94) | App + `src/packages/*` tests in one `pnpm test`; auth/security integration tests; Playwright smoke deferred |

## Architecture sketch

```text
User browser (:4041 local, Vercel in prod)
    → Next.js (repo root)
        → /backend/* → Hono app (src/server)
            → Email/password + JWT (httpOnly cookie on UI origin)
            → SQLite file (dev) or Turso (prod)
            → LLM / export / JD ingest
```

## API (in Next.js — Phase 93)

- Code: `src/server/` (Hono routes + lib)
- Public path: `/backend/*` (catch-all Route Handler → Hono)
- Runtime: Node.js (`maxDuration` 300s on `/backend/*` for long AI calls)
- Env: `DATABASE_URL`, `JWT_SECRET`, optional `TURSO_AUTH_TOKEN`, `ENCRYPTION_KEY` (see `.env.example`)
- Endpoints: `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `PUT /auth/password`, `GET /auth/me`, `GET /settings`, `PUT /settings`, `GET /settings/process`, `PUT /settings/process`, `PUT /settings/process/last-workflow`, `GET/POST /workflows`, `GET /workflows/:id/generation-fingerprint`, `GET/PUT/DELETE /workflows/:id`, `GET/POST /profiles`, `GET/PUT/DELETE /profiles/:id`, `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`, `GET/POST /experiences`, `GET/PUT/DELETE /experiences/:id`, `POST /ai-verdict`, `POST /ai-jd-meta`, `POST /ai-workflow-recommend`, `POST /ai-resume`, `POST /ai-evaluate`, `POST /ai-author-advise`, `POST /ai-author-advise/apply`, `POST /resume/docx`, `POST /resume/pdf`, `GET /ai-usage/summary`, `GET /ai-usage`, `GET /ai-usage/:id`, `GET /prompts`, `PUT /prompts/verdict`, `PUT /prompts/generate`, `PUT /prompts/evaluate`
- Prisma `User` → table `users`: `id`, `email` (login ID), `passwordHash`, `createdAt`, `updatedAt`
- **Phase 76:** `PUT /auth/password` `{ currentPassword, newPassword }` (min 8); verifies current hash then updates `passwordHash` only; `changePassword` in `src/lib/api.ts`
- Prisma `Setting` → table `settings` (one per user): `id`, `userId`, `provider`, `apiKey`, `createdAt`, `updatedAt`
- Prisma `Workflow` → table `workflows` (per user): `id`, `userId`, `profileId?` (FK → `profiles`), `name`, `description?`, `language`, `createdAt`, `updatedAt` (no `usedCount`, no `metadataJson`, no `verdictPrompt`)
- Prisma `WorkflowCompany` → table `workflowCompanies`: `id`, `workflowId`, `companyId`, `startDate`, `endDate`, `roleContext`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowId, companyId)`; cascade delete with workflow
- Prisma `WorkflowCompanyExperience` → table `workflowCompanyExperiences`: `id`, `workflowCompanyId`, `experienceId`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowCompanyId, experienceId)`; cascade delete with workflow company row
- Prisma `Profile` → table `profiles` (per user): `id`, `userId`, `firstName`, `lastName`, `birthDate?` (`YYYY-MM-DD`), `email?`, `pn?`, `residence?`, `university?`, `graduationYear` (required on write), `graduationMonth` (required on write, 1–12), `degree?`, `createdAt`, `updatedAt`
- Prisma `ProfileLink` → table `profileLinks`: `id`, `profileId`, `key`, `link?`, `sortOrder`, `createdAt`, `updatedAt`; unique `(profileId, key)`; cascade delete with profile
- Prisma `Company` → table `companies` (per user): `id`, `userId`, `displayPriority`, `alias`, `name`, `whatCompanyIs`, `createdAt`, `updatedAt`
- Prisma `Experience` → table `experiences` (per user): `id`, `userId`, `category`, `problem`, `actions`, `outcome`, `deletedAt` (nullable; archive timestamp), `createdAt`, `updatedAt`
- Prisma `AiUsage` → table `aiUsage` (per user): `id`, `userId`, `aiProvider`, `modelName`, `generateType`, `inputToken`, `outputToken`, `input`, `output`, `createdAt`
- Prisma `Prompt` → table `prompts` (one per user): `id`, `userId` (unique), `verdictPrompt`, `generatePrompt`, `evaluatePrompt`, `createdAt`, `updatedAt`
- Prisma `GenerationProcess` → table `generationProcess` (one per user): `id`, `userId` (unique), `doVerdict`, `doEvaluate`, `resumeLanguage`, `downloadFormat`, `experienceAdvisePoolDepth`, `combineExperiencesPerCompanyMax`, `experienceDimensionMode`, `experienceJdTierDecayPercent`, `createdAt`, `updatedAt`; defaults `doVerdict`/`doEvaluate` true, `resumeLanguage` `en`, `downloadFormat` `docx`, `experienceAdvisePoolDepth` `normal`, `combineExperiencesPerCompanyMax` `5`, `experienceDimensionMode` `technical_facet`, `experienceJdTierDecayPercent` `80`
- **Phase 36:** `PromptOptimization` / `promptOptimizations` and `usePromptOptimizationAi` removed; AI routes use deterministic `compileInstruction` only (see `src/server/lib/prompt-optimize/compile.ts`)
- SQLite table names are case-insensitive, so PascalCase (`User`) cannot be renamed to single-word camelCase (`user`). Tables use plural / compound camelCase: `users`, `settings`, `generationProcess`, `workflows`, ...
- **Convention:** all physical table names are camelCase via Prisma `@@map` (never PascalCase table names)
- **Migrations:** under `prisma/migrations/`. Local dev: `pnpm db:migrate`. CI and Docker entrypoint: `prisma migrate deploy` against a `file:` URL. **Vercel (Turso):** [`scripts/migrate-deploy-turso.ts`](../scripts/migrate-deploy-turso.ts) during `pnpm build` (see [`vercel-deploy.md`](./vercel-deploy.md)). Fresh Docker volume: `docker compose down -v` then `up` wipes `johel-data`.
- **Turso cutover:** backup SQLite → `scripts/prepare-sqlite-for-turso-import.sh` (sets `journal_mode=WAL`) → `turso db import`. Copy `JWT_SECRET` and `ENCRYPTION_KEY` from the source environment. Run `pnpm db:migrate-keys` once if plaintext API keys remain.

## Frontend (Phase 3)

- App package: repo root (`johel` in `package.json`)
- Listen: `http://127.0.0.1:4041`
- Same-origin API: `/backend/*` handled in-process (no separate API port or `API_ORIGIN` proxy)
- Client calls `/backend/...` with `credentials: "include"` so the JWT cookie is set on the UI origin
- Route groups:
  - `(auth)` — `/login`, `/register`
  - `(app)` — authenticated shell + placeholder home `/`
- Session gate: client checks `GET /backend/auth/me` before rendering app routes
- If a frontend component file exceeds **500 lines**, ask the user before growing it further; prefer splitting into smaller components/hooks
- Action controls: `AddButton` (plus), `EditButton` (pencil), `DeleteButton` (red trash), `CopyButton` (clipboard), `CloseButton` (X) in `components/shared/action-icon-buttons.tsx`
- Dialogs use `DetailDialog` (`components/shared/detail-dialog.tsx`) so Close (X) is always in the top-right header; the footer holds only the main action (Apply / Delete). Do not put Close beside that action. `mode="view"` (default) allows backdrop dismiss; `mode="form"` blocks backdrop dismiss for add/edit dialogs. Delete confirms use `mode="view"`. See `.cursor/rules/dialog-dismiss.mdc`.
- Drawers use shared `Drawer` (`components/shared/drawer.tsx`): stay mounted through open/close; panel `translate3d(100% → 0)` plus backdrop fade, 420ms `cubic-bezier(0.32, 0.72, 0, 1)` (velocity ease-out); unmount after the transition; `prefers-reduced-motion: reduce` skips the motion. Nested drawers (history + detail) each run this animation independently. Primary actions (Suggest, Apply, pagination, etc.) use the optional `footer` prop so they stay pinned below the scrollable body; Close remains in the header.

## Studio shell (Phase 4)

- Layout: top bar + left sidebar + main content (full-height studio chrome)
- Components: `components/app/StudioHeader`, `components/app/StudioSidebar`; theme via `ThemeProvider` + `johel-theme` in `localStorage`; UI locale via `LocaleProvider` + `johel-locale` in `localStorage` (`en` default, `ko`); FAB & drawer side via `DrawerPositionProvider` + `johel-drawer-position` in `localStorage` (`right` default, `left`); bootstrap script in root layout sets `document.documentElement.lang` before paint; message catalogs in `src/messages/` (`en.ts`, `ko.ts`, `translate.ts`); components use `useT()` / `useLocale()` from `LocaleProvider`; sidebar open/collapsed via `johel-sidebar` in `localStorage` (`open` default, `collapsed`). Hamburger in the header toggles `StudioSidebar` with a slide (`transform` + width, same `--drawer-duration` / `--drawer-ease` as drawers; first paint skips motion so stored collapsed state does not animate). `aria-controls="studio-sidebar"`.
- Theme: default `dark` on `<html class="dark">`; Settings page toggles Dark / Light. Tailwind `dark:` uses the `.dark` class (`@custom-variant dark` in `globals.css`), not `prefers-color-scheme`.
- Prompts (`/settings/prompts`), Environment (`/settings/environment`), and Generation (`/settings/generation`) content is centered at `max-w-3xl`, matching other form pages.
- `react-markdown` preview (`AiVerdictMarkdown`, `ResumeMarkdown`) uses `@tailwindcss/typography` `prose` with `--tw-prose-*` mapped to theme tokens (`--foreground`, `--muted`, `--border`) so body text stays readable in Light and Dark. Do not use `dark:prose-invert` (it follows OS color-scheme unless the class variant is set, and it ignores app tokens).
- Toast: top-center; variants success / warning / error / info with theme-aware bg and text tokens (`components/app/ToastProvider`). Any user action that calls the API must report the result with a toast.
- Routes (authenticated):
  - `/` — Workspace / Generate
  - `/profiles` — Workspace / Profiles
  - `/companies` — Workspace / Companies
  - `/experiences` — Workspace / Experiences
  - `/workflows` — Workspace / Workflows
  - `/settings/environment` — Settings / Environment (theme, UI language, FAB & drawer position, AI Agent); `/settings` redirects here
  - `/settings/generation` — Settings / Generation (Process, Resume Language, Download format, Experience advisor pool depth)
  - `/settings/prompts` — Settings / Prompts
  - `/prompts` — legacy redirect to `/settings/prompts`
  - `/account` — account page (login ID + reset password; distinct from Workspace Profiles)
  - `/profile` — legacy redirect to `/account`
- User menu: Account, Sign out
- Header **AI Assistant** (`AiAssistantTrigger` + `AiAssistantProvider` in `src/components/app/AiAssistant.tsx`): opens categorized assistance panel on click or **⌘K** / **Ctrl+K**; v1 ships **Check on Experiences** only (`runAiCheckOnExperiences` → `POST /ai-check-on-experiences`). Evaluate step text selection uses `TextSelectionToolbar` — **Check on Experiences** calls `openAiAssistant({ query, category: "check-on-experiences", generationId })`.
- `POST /ai-check-on-experiences` — body `{ searchText, generationId? }`; loads experience pool, embeds/ranks candidates (same embedding path as experience advise), optionally loads Combine-linked experience ids from the owned generation; LLM returns structured verdict (`gap_confirmed` | `exists_not_linked` | `exists_and_linked`) formatted as Markdown; `generateType: checkOnExperiences` (+ `embedding` for query vector). AI Usage History still labels legacy `checkGaps` rows as **Check on Experiences**.
- **Floating token metrics** (`StudioTokenMetricsFloater`): fixed bottom card on the side opposite the FAB stack (`studioOppositeFabClass` in `drawer-position.ts`); **Today** and **Total** counts from `AiUsageProvider` / `GET /ai-usage/summary` (`formatTokenUsed`); hover fades the card and sets `pointer-events-none` so text underneath stays selectable until the cursor leaves the card bounds
- **Global FAB cluster (Phase 32, 41, 63, 75):** fixed bottom vertical stack (`StudioBottomFabCluster`, `studioFabClusterClass`): **Quick Add Experience** plus FAB (above) opens `QuickAddExperience` drawer; history (clock) FAB opens AI Usage History `Drawer` with **All** / **Generation** / **Other** tabs; suggestion preview uses nested `ExperienceSuggestionDrawer` (z-index 60). AI Usage History row click opens nested detail `Drawer` with **Input** / **Output** tabs; `listAiUsage` / `listAiUsageGroups` / `getAiUsage` in `src/lib/api.ts`
- Sidebar: **Workspace** (Profiles, Companies, Experiences, Workflows — always open), **Run** (Generate — always open), **Settings** (Environment, Generation, Prompts — always open); section labels use normal title case (not all caps)

## AI Agent settings (Phase 5, 21)

- Provider id: `openai` (UI label: OpenAI)
- `GET /settings` → `{ provider, apiKeyMasked }` or both `null` if unset
- `PUT /settings` → `{ provider: "openai", apiKey }` (min 8 chars); upsert; returns `{ provider, apiKeyMasked }`
- One active provider + one API key per user in `settings`
- Mask derived at read time: first 4 + ` ******** ` + last 4 (e.g. `4F28 ******** 3429`)
- `apiKey` encrypted at rest with AES-256-GCM when `ENCRYPTION_KEY` is set (Phase 83); never returned to the client; decrypt via `getUserAiSettings`
- Web Settings: enabled provider dropdown; masked key shown only when the selected provider matches the saved provider; Save stays enabled with inline validation on submit; toast on API result

## Process settings (Phase 26, 36, 80)

- `GET /settings/process` → `{ doVerdict, doEvaluate, resumeLanguage, downloadFormat, experienceAdvisePoolDepth, combineExperiencesPerCompanyMax, experienceDimensionMode, experienceJdTierDecayPercent }` (defaults: Verdict/Evaluate true, `resumeLanguage` `en`, `downloadFormat` `docx`, `experienceAdvisePoolDepth` `normal`, `combineExperiencesPerCompanyMax` `5`, `experienceDimensionMode` `technical_facet`, `experienceJdTierDecayPercent` `80`)
- `PUT /settings/process` → same fields; `resumeLanguage` is one of `en`, `ja`, `zh-TW`, `zh-CN`, `ko`; `downloadFormat` is `docx` or `pdf` (coerced to `docx` when `resumeLanguage` is not `en`); `combineExperiencesPerCompanyMax` is integer `1`–`10`; `experienceDimensionMode` is one of `star_axis`, `jd_signal`, `technical_facet`, `problem_item`; `experienceJdTierDecayPercent` is one of `30`, `50`, `70`, `80`; upsert by `userId`; returns saved values
- Web Settings **Generation** page (`/settings/generation`): **Process**, **Resume Language**, **Download** (DOCX / PDF radios; PDF disabled unless Resume Language is `en`), **Experience advisor pool depth**, **Combine experiences per company** (max linked cards per company on Combine Suggest), **Experience JD tier decay** (% presets with example tier chains), and **Experience dimension mode**; one **Save** persists all; toast on API result; saving changed Process flags, resume language, pool depth, JD tier decay, or dimension mode clears in-progress Generate session; changing download format or combine max alone does not
- Generate / Evaluate / History **Download** uses `ResumeDownloadDropdown` + `useResumeDownload` (`downloadAs("docx" | "pdf")`); **PDF** disabled when resume language is not `en` via `isPdfDownloadAvailable`
- Generate reads process settings on load; syncs `combine.language` from saved `resumeLanguage`; Verdict Prompt prerequisite only when `doVerdict`; Evaluate Prompt only when `doEvaluate`
- When `doVerdict` is false: Job **Run** skips `POST /ai-verdict` and calls `POST /ai-jd-meta` to extract **JD Company Name** and **JD Role** from the filtered JD; editable fields appear at the top of **Combine**; resume generation uses noise-filtered job description as `jobContext`
- When `doVerdict` is true: Workflow shows AI Verdict result; resume generation and evaluation send that Markdown as `jobContext` instead of the raw job description (Verdict Prompt structure and extracted fields affect tailoring quality)
- When `doEvaluate` is false: timeline is Job → Workflow → Generate; Generate **Download** is last-step action; Evaluate step hidden; stored `activeStep: "Evaluate"` normalizes to Generate on load
- When `doWorkflowRecommendation` is true: after Job **Next** (with or without Verdict), Generate calls `POST /ai-workflow-recommend` unless session `workflowRecommendInputKey` matches; auto-selects workflow when score ≥ threshold; otherwise clears selection and toasts; when false, restores `lastSelectedWorkflowId` without AI

## Prompt compile (Phase 29, revised Phase 36, 40)

- Module: `src/server/lib/prompt-optimize/` — `compileInstruction`, `PROMPT_SECTION_SEPARATOR`, `PROMPT_COMPILER_VERSION` (`2`); `extractMarkdownHeadings` / `formatJobContextBlock` in `job-context.ts`
- **Deterministic compile (always):** trim, collapse extra blank lines, wrap stored prompt markdown under `# Instructions`, then append `PROMPT_SECTION_SEPARATOR` (`----------------------------------------`)
- **Runtime system prompt:** compiled Instructions + `# Execution rules` (minimal provider-safe rules) + separator + provider notes; Verdict / Generate / Evaluate output structure and tailoring rules live in the user's stored prompt, not in fixed system sections
- **Run guidance:** Combine `emphasis` is sent in the user message under `## Run intent` as `Run guidance:` (replaces the former separate One-time Prompt on the system prompt)
- Generate cache keys (`buildVerdictInputKey`, `buildGenerationInputKey`, `buildEvaluationInputKey`, `buildWorkflowRecommendInputKey`) include prompt hashes via `src/lib/prompt-hash.ts` (no optimization flag); Generate/Evaluate keys also include `labeledUserMessageVersion` so a user-message layout change invalidates stored AI results

## Workflows (Phase 6–7, 22, 30, 35)

- `GET /workflows?q=&page=` — page size 10; lean list items (name, description, dates)
- `GET /workflows/:id` — full detail for the editor (owner only): `profileId`, ordered `companies[]` (`companyId`, `startDate`, `endDate`, `experienceIds[]`), plus scalar fields
- `POST /workflows` / `PUT /workflows/:id` — `{ name, description, language, profileId, companies: [{ companyId, startDate, endDate, roleContext, experienceIds[] }] }`; `description` required (trim, min 1, max 2000; used as a resume-generation prompt); validates one profile, ≥1 company entry, required period and role context per entry, ≥1 experience per entry (all owned by user); unique `companyId` per workflow; on write, replaces `workflowCompanies` and nested `workflowCompanyExperiences`
- Language codes: `en`, `ja`, `zh-TW`, `zh-CN`, `ko` (default `en`)
- Web routes: `/workflows` list (table columns: No, Name, Description, Updated, actions); `/workflows/new` add; `/workflows/[id]/edit` edit; editor has name, required description (resume-generation prompt hint), language, `WorkflowProfilePicker`, and `WorkflowCompaniesEditor` (Add/Edit dialog with company, period, experiences)
- Generate Workflow step workflow table columns: Name, Description, Updated
- **Phase 22 migration note:** `workflowMetadata` dropped; existing workflows need profile/companies/experiences re-selected in the editor
- **Phase 35 migration note:** `workflowExperiences` dropped; company entries now store required `startDate`/`endDate` and nested experience links via `workflowCompanyExperiences`; existing workflows need company entries re-added in the editor
- **Phase 42 migration note:** `workflows.description` is required (non-null, default `""`); existing null descriptions are backfilled to empty string—edit and save a description before using the workflow if it was previously blank

## Profiles (Phase 8)

- `GET /profiles?q=&page=` — page size 10; list includes `links` for the Links column
- `GET /profiles/:id` — full detail for the editor (owner only)
- `POST /profiles` / `PUT /profiles/:id` — `{ firstName, lastName, birthDate?, email?, pn?, residence?, university?, graduationYear, graduationMonth, degree?, links }`; on write, delete existing `profileLinks` and insert the submitted list
- Search `q` across firstName, lastName, email, pn, residence, education
- Links: `{ key, link | null }`; keys unique per profile
- Web routes: `/profiles` list; `/profiles/new` add; `/profiles/[id]/edit` edit; Links UX mirrors workflow Metadata

## Companies (Phase 9, 30, 31, 44)

- `GET /companies?q=&page=` — page size 10
- List order: `displayPriority` ascending, then `name` ascending
- `GET /companies/:id` — full detail for the editor (owner only)
- `POST /companies` / `PUT /companies/:id` — `{ displayPriority, alias, name, whatCompanyIs }` where `displayPriority` is a 1-based integer; on write, `whatCompanyIs` is converted to markdown via AI when changed since last save (create always converts); unchanged field skips conversion; requires Settings provider/apiKey when conversion runs
- Search `q` across alias, name, and whatCompanyIs
- Web routes: `/companies` list (columns: Display Priority, Alias, Company Name, What this company is); `/companies/new` add; `/companies/[id]/edit` edit; editor fields in order: display priority, alias, company name, what this company is; English guidelines and good/bad examples on what this company is; shared guidance that personal achievements belong in shared experiences
- **Phase 91:** `companies.domainAndStack` dropped (existing data not preserved)
- **Display priority migration:** existing companies receive sequential 1-based priorities per user ordered by former `name` sort

## Experiences (Phase 10, 30, 45, 87)

### Soft archive (Phase 87)

- **Delete** (`DELETE /experiences/:id`) sets `deletedAt` and removes the row from `experienceEmbeddings`; archived rows stay in the database for stored generation `combineJson` references.
- **Live pool** — list/get, `GET /pce`, Combine Suggest index, Experience advisor context, and resume assembly load only `deletedAt: null` experiences.
- Helper: `liveExperienceWhere(userId)` in `src/server/lib/experience-live.ts`; `archiveExperience({ userId, experienceId })` for delete and split apply.

### Split by capability (Phase 87)

- `POST /ai-experience-split` — body `{ experienceId }`; AI proposes `create_experience` operations only; returns `{ result, workspaceFingerprint, tokenUsed }`; `generateType: experienceSplit` (`gpt-5.6-luna`).
- `POST /ai-experience-split/apply` — body `{ experienceId, workspaceFingerprint, operations }`; creates new live cards, archives source unchanged, returns `{ experienceIds, archivedId, warnings }`.
- Module: `src/server/lib/ai-experience-split/`; density heuristics in `src/server/lib/experience-density.ts` (also mirrored on web for UI badge).
- Web: Experiences list **Dense** badge + **Split** action (enabled when dense); `ExperienceSplitDrawer` + `ExperiencesSplitSession`; detail dialog Split when dense. After apply, toast warns to relink Combine.
- Combine sanitize (`GenerateCombineStep`) toasts when archived/missing experience ids are stripped from the active session.

## Experiences — CRUD (Phase 10, 30, 45)

- `GET /experiences?q=&page=` — page size 10; each item includes `isDense` (Phase 87 density heuristics)
- List order: `category` ascending (same order in the workflow experience picker, which uses the same list API)
- `GET /experiences/:id` — full detail for the editor (owner only)
- `POST /experiences` / `PUT /experiences/:id` — `{ category, problem, actions, outcome }` (all required); on write, changed STAR fields are converted to markdown via **one batched AI call** (`formatExperienceFieldsOnSave`) when any of the three differ from stored values (create always converts); all unchanged → skip conversion; requires Settings provider/apiKey when conversion runs
- `POST /ai-experience-advise/apply` — persists advisor create/update operations; STAR fields use **deterministic finalize only** (`finalizeExperienceFieldsForAdvisorApply` in `src/server/lib/ai-experience-advise/apply.ts`: `finalizeExperienceFieldsOnSave` + length/empty validation); **no** `markdownFormat` AI call on Apply (Phase 65)
- Search `q` across category, problem, actions, and outcome
- Web routes: `/experiences` list (columns: Category, Problem, Actions, Outcome); `/experiences/new` add; `/experiences/[id]/edit` edit; editor shows bullet-format guidelines and examples on problem/actions/outcome and shared guidance on one card = one capability unit; `DESCRIPTION_AS_RESUME_PROMPT_HINT` on each prompt field; Save right-aligned
- **Phase 45 migration note:** `experiences.description` dropped; existing rows backfill `problem` from former `description`, `actions` and `outcome` to empty string — users must fill actions on next edit

## CRUD list pagination and history back (Phase 53)

- List pages (`/profiles`, `/companies`, `/experiences`, `/workflows`) sync pagination and search to URL query params: `?page=` (omitted when `1`) and `?q=` (omitted when empty); pagination updates use `router.replace` (no extra history entry per page click)
- Hook: `useCrudListParams` in `src/lib/crud-list-params.ts`; list content wrapped in `Suspense` (required for `useSearchParams`)
- Add/edit forms use `useCrudFormNavigation(fallbackHref)` and `BackButton` with `preferHistoryBack` so Back, Cancel, and post-save navigation call `router.back()` when history exists, else `router.push(fallbackHref)`

## Generate UI (Phase 11–20, 22, 24, 25, 26, 27, 28)

- Route `/` gates on at least one Profile, Company, and Experience plus saved Generate Prompt; Verdict Prompt required only when `doVerdict`; Evaluate Prompt required only when `doEvaluate`; otherwise a centered alert with links (not a toast)
- Timeline steps: Job → **Verdict** (when `doVerdict`) → **Combine** → Generate, plus **Evaluate** when `doEvaluate` is true
- Page layout: full main content width (`-m-6` on the page section to cancel main padding; no `max-w-4xl`); section height `calc(100dvh - 3.5rem)` (app header) with `overflow-hidden` so step columns scroll independently
- Two-column step body via `GenerateStepLayout`: left panel = read-only previous-step preview (`useGeneratePreviousStepPanel` + `GenerateJobDescriptionPreview`, `AiVerdictMarkdown`, `GenerateCombineSummary`, or `ResumeMarkdown`); right panel = current step; both panel cards share the same header chrome (`text-sm` title, optional `headerRight`, `border-b`) and `bg-surface`; both cards `h-full` so they stretch to the row height; each column `overflow-y-auto` with fixed panel header; stacked on narrow viewports (`max-h-[50vh]` per section). On `lg+`, a draggable resize handle between columns adjusts the visual left/right split (20–80%, default 50%); ratio persists in `localStorage` (`johel-generate-panel-left-percent` via `generate-panel-split.ts`) and applies to every step and the History detail drawer. **Job** step sets `swapColumns` + `currentFill`: Job input on the left (textarea fills remaining panel height), filtered preview on the right with filtered character count in the panel header (`previousHeaderRight`). **Generate** step (when `doVerdict`): left panel header shows **Verdict** / **Combine** tabs (`GenerateReferenceTabs`) to switch between read-only Verdict Markdown and Combine summary; defaults to Combine. **Evaluate** step: left panel header shows **Verdict** (when `doVerdict`) / **Combine** / **Generated resume** tabs; defaults to Generated resume. Current-step titles come from `getGenerateCurrentPanelTitle`.
- Sticky header: page title row includes **New** (plus icon + label) to reset the in-progress Generate session to a blank Job step; step row (`GenerateTimeline` + `GenerateStepNavRunButton`) uses `sticky top-0`; `bg-background` and bottom border
- Step navigation (Phase 64): timeline steps are **clickable** for browse-only navigation (`onStepSelect` → `setActiveStep`); **Run** (play icon, right gutter) advances to the next step and executes AI when applicable; **Previous** removed — use timeline to go back; steps register handlers via `useRegisterGenerateStepNav` (`onRun`, `downloadMenu`)
- Job UI (Manual): **Job Description** only (max 10,000 chars) + right **Run**; URL and File tabs show an info alert (“not implemented yet / coming soon”)
- **JD Company Name** and **JD Role** are extracted automatically (not typed on Job): when `doVerdict`, parsed from Verdict Markdown via `@johel/jd-meta` (`extractJdMetaFromVerdictMarkdown`) after `POST /ai-verdict` (also returned in the API response); when `!doVerdict`, extracted via `POST /ai-jd-meta` (lightweight JSON AI call, `generateType: jdMeta`); both fields are editable on **Verdict** (when enabled) or **Combine** (when Verdict disabled); persisted in `jobJson`
- Default Verdict prompt requires structured `- Title:` under `## Role` and `- Company name:` under `## Company & Contacts`; execution rules reinforce those lines for reliable parsing
- Job **Run**: inline validation if JD empty; clears downstream resume/evaluation and JD meta (confirm when stale); when `doVerdict`, navigates to Verdict and runs `POST /ai-verdict` (reuses stored verdict when `verdictInputKey` matches; re-parses JD meta from cached Markdown on reuse); when `!doVerdict`, runs `POST /ai-jd-meta` then navigates to Combine
- Verdict **Run**: validates JD Company Name and JD Role, then navigates to Combine (no AI)
- Combine **Run** (when `!doVerdict`): validates JD Company Name and JD Role before advancing
- Combine **Run**: validates snapshot; clears downstream resume/evaluation (confirm when stale); navigates to Generate and runs `POST /ai-resume` (reuses when `generationInputKey` matches)
- Generate: `GenerateGenerateStep` / `EditableResumePanel` — **Edit** / **Preview** toggle on Markdown derived from stored JSON; debounced `markdownToResume` commits valid edits to session `resume`; inline parse error keeps last valid JSON; panel header uses `GeneratePanelHeaderActions` (Copy + **Revert to AI version**); **Run** (when `doEvaluate`) navigates to Evaluate and runs `POST /ai-evaluate` (confirm when evaluation exists; reuses when `evaluationInputKey` matches, which includes `resumeHash`); **Download** on this step when `doEvaluate` is false
- Evaluate: `GenerateEvaluateStep` renders evaluation Markdown via `AiVerdictMarkdown`; **Download** calls `POST /resume/docx` with stored JSON
- One Generate **process** spans Job through resume download; session persists after download until **New** or until Settings **Process** flags change (Do Verdict / Do Evaluate saved with different values)
- In-progress Generate run **content** (timeline step, Job, Combine, resume, evaluation) is persisted on the **`generations`** row (debounced `PUT`); **`users.currentGenerationId`** is the account-wide “current generation” pointer (updated on `POST /generations/start`, `PUT /generations/:id`, and `POST /generations/:publicId/resume`); per-device **`sessionStorage`** (`johel:generate-session-local:{userId}`) holds only client cache fields: `verdictInputKey`, `generationInputKey`, `evaluationInputKey`, `resumeAiSnapshot`, `jobDuplicateDismissedHash` (scoped by generation id); legacy full-session keys migrate once on load
- Last Combine **profile** and included **companies** (period, role context, keyword context) remembered per user in `localStorage` (`johel:combine-defaults:{userId}`) via `src/lib/combine-defaults.ts`; updated on every `setCombine`; seeded when **+ New** allocates a generation or when the current generation has an empty Combine selection; deleted profile/company ids stripped in `GenerateCombineStep`; **Run guidance** and `experienceIds` are not remembered
- List APIs (`GET /workflows`, etc.): `page=null` or `limit=null` returns all matching items
- Token display: `formatTokenUsed` in `src/lib/tokens.ts` (delegates to `formatThousandsSeparated` in `src/lib/helper.ts`); all user-visible numbers use thousand-separated formatting; header from `GET /ai-usage/summary`
- Components under `src/components/generate/` (`GenerateJobStep`, `GenerateWorkflowStep`, `GenerateGenerateStep`, `GenerateEvaluateStep`, `GenerateStepNav`, `PceSection`); workflow editor uses `WorkflowProfilePicker`, `WorkflowCompaniesEditor`, and `WorkflowCompanyDialog`

## AI Verdict (Phase 13, 19, 40)

- `POST /ai-verdict` — body `{ jobDescription }` (1–10,000 chars; client sends noise-filtered text); requires saved Settings provider/apiKey and non-empty `prompts.verdictPrompt`; system prompt = compiled `# Instructions` (user Verdict Prompt) + `# Execution rules` (Markdown-only, follow Instructions, parseable `- Title:` / `- Company name:` lines, Not found); returns `{ markdown, jdCompanyName, jdJobRole, tokenUsed }` where company/role are parsed from Verdict Markdown via `@johel/jd-meta`
- `POST /ai-jd-meta` — body `{ jobDescription }` (1–10,000 chars; noise-filtered text); lightweight JSON extraction of `jdCompanyName` and `jdJobRole` when **Do Verdict** is off; `generateType: jdMeta`; returns `{ jdCompanyName, jdJobRole, tokenUsed }`
- Shared parser: `src/packages/jd-meta` — `extractJdMetaFromVerdictMarkdown(markdown)` reads `## Role` / `- Title:` and `## Company & Contacts` / `- Company name:`
- `GET /ai-usage/summary` — `{ tokenUsed, todayTokenUsed }` = sum of `inputToken + outputToken` for the user (`todayTokenUsed` = same sum for rows with `createdAt` on the current UTC calendar day); optional `generationId` query returns `{ tokenUsed }` for that generation only (from `generations.inputToken` + `outputToken`); `sumTokenUsed` / `sumTodayTokenUsed` in `src/server/lib/sum-token-used.ts`
- `GET /ai-usage?page=` — owner-only paginated list; page size **100**; `orderBy: { createdAt: "desc" }`; returns `{ items, total, page, pageSize }` where each item has `id`, `aiProvider`, `modelName`, `generateType`, `inputToken`, `outputToken`, `createdAt` (omits `input` / `output`)
- `GET /ai-usage/:id` — owner-only detail including `input` and `output`; 404 when missing or not owned
- Each `aiUsage` row stores `modelName` and `generateType` via `recordAiUsage` (`src/server/lib/record-ai-usage.ts`): active `generateType` values are `verdict`, `jdMeta`, `generate`, `evaluate`, `workflowRecommend`, `markdownFormat`, `authorAdvise` (UI label **Quick Experience**), `experienceAdvise`, `experienceSplit`, `combineRecommend`, and `checkOnExperiences`; historical rows may still have `promptHelper` (label **Prompt Helper** in AI Usage History) or legacy `checkGaps` (label **Check on Experiences**); `modelName` is `auto` for Cursor, `gpt-5.6-luna` for OpenAI verdict/jdMeta/evaluate/workflow-recommend/author-advise/experience-advise/experience-split/combine-recommend/check-on-experiences, `gpt-5.6-sol` for OpenAI markdown-format, `gpt-5.6-terra` for OpenAI resume generation
- Provider adapter under `src/server/lib/ai-verdict/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Markdown output structure is **user-defined** in the Verdict Prompt (default template seeded on sign-up); JoHEL does not enforce fixed `## Verdict` / `## Job` / `## Company` sections
- Web: `runAiVerdict` in `src/lib/api.ts`; Job step fullscreen loading; Workflow step renders result with `AiVerdictMarkdown` (`react-markdown` + `@tailwindcss/typography` theme tokens); `AiUsageProvider` refreshes header total after success
- **Note:** Phase 13 introduced this as `POST /ai-filter`; Phase 19 renamed to `ai-verdict` and wired into Generate Job **Next**

## Prompts settings (Phase 18, 23, 34, 39, 40, 43)

- `GET /prompts` → `{ verdictPrompt, generatePrompt, evaluatePrompt }` — empty strings when no row yet (owner only); new sign-ups receive defaults from `@johel/prompt-defaults` via `POST /auth/register` (Verdict default uses Role / Technical Requirements / Final Verdict sections; Generate default maps those headings and caps skills at 3–5 groups and 12 items; Evaluate default scores the same Verdict dimensions)
- `PUT /prompts/verdict` → body `{ verdictPrompt?, verdictExtension? }`; `PUT /prompts/generate` → `{ generatePrompt?, generateExtension? }`; `PUT /prompts/evaluate` → `{ evaluatePrompt?, evaluateExtension? }` (system prompt trim, min 1 when provided, no max length; extension optional, max 10,000 chars; at least one field required); upsert by `userId`; on write, only the submitted system prompt is converted to markdown via AI when changed (unchanged skip conversion); requires Settings provider/apiKey when conversion runs; each endpoint returns all prompts and extensions
- Web route `/settings/prompts`: **Verdict**, **Generate**, and **Evaluate** tabs (`?tab=verdict|generate|evaluate`, default Verdict); page copy states that system prompt changes directly affect resume generation quality; each tab shows two sections — system prompt (read-only `AiVerdictMarkdown` preview, muted placeholder when empty) and optional extension (textarea); **Edit** (pencil) opens `PromptEditDialog` (textarea + left-aligned system-impact notice, **Reset** to `@johel/prompt-defaults` draft, **Apply** — local until that tab’s **Save**); auto-markdown notice and resume-context hints where applicable; fullscreen `BusyOverlay` when conversion runs; per-tab **Save** (always enabled; inline validation on submit); toast on API result; refreshes header Token Used after save
- Legacy web routes `/prompts` and `/verdict` redirect to `/settings/prompts`
- Company editor form (`CompanyForm`): alias, company name, what this company is, and domain & stack; prompt fields show auto-markdown notice; fullscreen `BusyOverlay` when conversion runs; detail dialog renders prompt fields with `AiVerdictMarkdown`. Experience editor form (`ExperienceForm`): Description textarea with the same auto-markdown behavior.
- Client: `getPrompts`, `savePrompt` in `src/lib/api.ts`; placeholders in `src/lib/prompts.ts`
- Verdict Prompt consumed by `POST /ai-verdict`; Generate Prompt consumed by `POST /ai-resume`; Evaluate Prompt consumed by `POST /ai-evaluate`

## AI Markdown Format (Phase 38, 40)

- Embedded in `PUT /prompts/verdict`, `PUT /prompts/generate`, `PUT /prompts/evaluate`, `POST/PUT /companies`, `POST/PUT /experiences` write handlers (no separate endpoint); **not** used on `POST /ai-experience-advise/apply` (advisor Apply uses deterministic finalize only — Phase 65)
- Module: `src/server/lib/ai-markdown-format/` — `formatMarkdownOnSave` helper; `formatExperienceFieldsOnSave` batches `problem` / `actions` / `outcome` into one AI call (JSON response, then per-field finalize); kinds `verdict` | `generate` | `evaluate` | `companyWhatItIs` | `experienceProblem` | `experienceActions` | `experienceOutcome`
- Skip rule: when `submitted.trim() === stored.trim()`, persist without AI (no API key required); prompt kinds still run deterministic `#`→`##` heading cap on save
- When changed: requires Settings provider/apiKey; AI converts text to structured markdown (preserve meaning, fold `## New` helper blocks, no invented content); **prompt kinds** additionally require `##` as the largest heading (AI rule + `capPromptHeadings` post-process); **structured list kinds** (`experienceProblem`, `experienceActions`, `experienceOutcome`) format each item as a bullet with a bold label and indented body, strip accidental `#` headings and field-type metadata; strips accidental code fences; rejects empty or over-limit output
- Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`); OpenAI via `runOpenAiMarkdownFormatResponse` (`gpt-5.6-sol`, reasoning `low`); usage stored as `generateType: "markdownFormat"`; AI Usage History label **Markdown Format**
- Prompts: changed fields convert in parallel before upsert
- Web: `AUTO_MARKDOWN_FORMAT_HINT` in `src/lib/markdown-format.ts`; `BusyOverlay` during save when client detects changed fields; `refreshTokenUsed` after successful save
- Independent of Settings Process flags

## AI Workflow Recommendation (Phase 36)

- `POST /ai-workflow-recommend` — body `{ jobDescription, acceptedMarkdown? }` (job 1–10,000 chars noise-filtered text; optional verdict markdown); requires saved Settings provider/apiKey and ≥1 owned workflow; loads workflow summaries (name, description, language, profile name, deduplicated flat `experiences` with id/category/problem/actions/outcome, company periods with `experienceIds` referencing that list); AI returns structured `{ matches: [{ workflowId, score }] }` (scores 0–100); server picks highest score and applies user’s `workflowRecommendationThreshold` from `generationProcess`; returns `{ workflowId, workflowName, score, threshold, usage, tokenUsed }` where `workflowId` is null when best score is below threshold
- Module: `src/server/lib/ai-workflow-recommend/` — prompts, `parse-response`, `pickRecommendedWorkflow`, Cursor/OpenAI provider adapters; summaries via `loadWorkflowRecommendSummaries`
- Web: `runAiWorkflowRecommend` in `src/lib/api.ts`; Generate page runs after Job **Next** when `doWorkflowRecommendation`; session caches via `buildWorkflowRecommendInputKey` + `workflowRecommendInputKey`; manual workflow row select calls `PUT /settings/process/last-workflow`

## AI Resume (Phase 20, 22, 23, 28)

- `POST /ai-resume` — body `{ jobContext, workflowId, oneTimePrompt? }` where `jobContext` is AI Verdict Markdown when the client ran Verdict, otherwise noise-filtered job description text (1–10,000 chars); requires saved Settings provider/apiKey and non-empty `prompts.generatePrompt`; server loads the owned workflow (profile, ordered company entries with period and linked experiences) and assembles generation input; system prompt = compiled user Generate Prompt + optional `## One-time prompt` section when `oneTimePrompt` is non-empty + shared resume rules (use Job context as rubric; map missing Instruction headings to the closest sections present; JSON-style field names in Instructions map to labeled subsections); user prompt is labeled Markdown (`## Job context` with a heading list, `## Workflow intent`, `## Profile`, `## Companies (resume order)`) — not a JSON dump of the assembled input; ids and company alias are omitted; empty optional profile/outcome fields are skipped; returns `{ resume, usage, tokenUsed }` where `resume` is validated `GeneratedResume` JSON
- `GET /workflows/:id/generation-fingerprint` — returns `{ fingerprint }` where `fingerprint` is a stable JSON string of the assembled profile, nested companies (with period and linked experiences), and workflow fields (same source as `assembleResumeGenerationInput`, excluding job text); used by Generate to detect PCE edits without re-running AI on unchanged content
- Provider adapter under `src/server/lib/ai-resume/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-terra`, reasoning `medium`, JSON output); response parsed as JSON only and validated with Zod from `@johel/resume`; `finalizeResumeSummaryCareerYears` in `career-years.ts` sets summary `+{N} years of experience` from the simple sum of Combine company periods and **overwrites** any AI-written lead (N not trusted from model output); `normalizeEducationDatesInResume` strips graduation month from `education[]` dates (year-only in output); Profile graduation month is still used for Combine period bounds but is not sent to the model as a month in education input; `resume-generation-policy.ts` computes JD tier weights (`100% × (decayPercent/100)^index`; default decay 80%) and dimension-mode prompt text; default Generate Prompt forbids Summary meta job-search phrasing and Experience bullet JD keyword chains; Generate user prompt injects per-company `JD tailoring weight` and `generationPolicy` (`experienceDimensionMode`, `experienceJdTierDecayPercent`) from `generationProcess`
- Web: `runAiResume` in `src/lib/api.ts`; Workflow **Next** fullscreen loading; session stores `resume` + `generationInputKey`; Generate step renders Markdown; Evaluate step downloads DOCX without re-calling AI when inputs are unchanged

## AI Evaluate (Phase 25)

- `POST /ai-evaluate` — body `{ jobContext, resume }` (`jobContext` 1–10,000 chars; same text as Generate: Verdict Markdown when Do Verdict ran, otherwise noise-filtered job description; `jobDescription` accepted as a fallback field name; `resume` validated `GeneratedResume`); requires saved Settings provider/apiKey and non-empty `prompts.evaluatePrompt`; system prompt = compiled user Evaluate Prompt + `# Execution rules` (labeled Job context then Resume; use Verdict headings as rubric when present, otherwise derive the same dimensions) + provider notes; user prompt is labeled Markdown (`## Job context` with a heading list, then `## Resume`); server converts resume to Markdown via `resumeToMarkdown`; returns `{ markdown, usage, tokenUsed }`
- Provider adapter under `src/server/lib/ai-evaluate/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Web: `runAiEvaluate` in `src/lib/api.ts` (`jobContext` from `buildResumeJobContext`); Generate **Next** fullscreen loading; session stores `evaluationMarkdown` + `evaluationInputKey` (generation fingerprint plus evaluate prompt hash and `labeledUserMessageVersion`); Evaluate step renders result with `AiVerdictMarkdown`

## Quick Experience authoring advisor (Phase 49)

- `POST /ai-author-advise` — body `{ workflowId?, userFacts }` (facts 1–10,000 chars); requires Settings provider/apiKey; loads workspace graph via `loadAuthorAdviseGraph`: when `workflowId` is set, only that workflow’s profile, company entries, and linked experiences (`assembleResumeGenerationInput`); when omitted, every owned workflow with the same shape (never-linked workspace cards excluded); fixed system prompt encodes [`workspace-authoring.md`](./workspace-authoring.md) routing (including no employer names in Experience STAR drafts); for update placements, AI returns delta-only draft fields (new content only; unchanged fields `null`); user message = scope + workflow blocks + user facts (no Job/Evaluate session); Cursor `Agent.prompt` / OpenAI Responses `json_object` (`gpt-5.6-luna`); returns `{ proposal, workspaceFingerprint, usage, tokenUsed }`; fingerprint is `buildWorkflowGenerationFingerprint` for one workflow or JSON array of per-workflow fingerprints when scope is all
- `POST /ai-author-advise/apply` — body `{ workflowId?, workspaceFingerprint, proposal, draft? }`; deterministic Prisma writes in `applyAuthorAdviseProposal` (experience/company create or update, workflow link, role context, workflow description); stale fingerprint → 409; uses existing `formatMarkdownOnSave` on changed markdown fields; returns `{ ok, appliedWorkflowId, warnings }`
- Module: `src/server/lib/ai-author-advise/` (`load-graph`, `fingerprint`, `prompts`, `parse-response`, `merge-experience-field`, `apply`, Cursor/OpenAI providers)
- Web merge (Phase 51–52): for all update placements (`update_experience`, `update_company`, `update_role_context`, `update_workflow_description`), `QuickExperience` loads existing stored text and merges each changed field with the AI delta via `mergeExperienceFieldUpdate` / `buildAuthorAdviseDisplayDraft` before showing the Suggestion drawer; Apply sends the merged textarea as `draft` (WYSIWYG replace, no server-side append)
- Web: `StudioBottomFabCluster` (history + plus FABs); `QuickExperience` drawer + nested `QuickExperienceSuggestionDrawer`; `runAuthorAdvise` / `applyAuthorAdvise` in `src/lib/api.ts`; Apply dispatches `johel:workspace-updated` (`workspace-updated.ts`); `useGenerateSession` clears stored resume/evaluation when the event affects the session workflow or is a shared company/experience update

## Resume module (`@johel/resume`, Phase 20)

- Inlined under `src/packages/resume` (import alias `@johel/resume`)
- Canonical model: `GeneratedResume` (Zod schema in `domain/generated-resume.ts`)
- `resumeToMarkdown(resume)` — deterministic Markdown for web display (main export); section order matches the default DOCX template: Header, Summary, Experience, Skills, Education, Certifications, Projects
- `markdownToResume(markdown)` — inverse parser for Generate-step Markdown edits; validates with `generatedResumeSchema`; round-trip tested against `resumeToMarkdown`
- `buildResumeExportFileName({ publicId?, jdCompanyName?, jdJobRole?, exportDate? }, format)` — `{YYYYMMDD} - {NN} - {JD Company Name} - {JD Job Role}.{docx|pdf}` where `{NN}` is the zero-padded sequence parsed from `GEN-YYYYMMDD-NNN` public IDs (fallback `00`); segments preserve readable text with unsafe filename characters stripped
- `@johel/resume/docx` — `buildResumeDocxBuffer` / `buildResumeDocxBlob` (server/Node); section builders under `docx-builder/sections/` and `docx-builder/templates/default.ts` (same section order as Markdown); shared `ResumeDocxStyle` in `docx-builder/styles.ts` (default font Arial)
- `@johel/resume/pdf` — `buildResumePdfBuffer` / `buildResumePdfBlob` via `pdf-lib` (Helvetica; English-only product constraint; no CJK font embedding); A4 page size; `PdfLayout` reads page dimensions from each `PDFPage` so margins align with the rendered page; same section order as DOCX under `pdf-builder/templates/default.ts`; `filterPdfText` drops characters outside Standard Font WinAnsi before layout so mixed Unicode in resume JSON does not fail generation
- `POST /resume/docx` — body `{ resume, runLabel? }` (validated `GeneratedResume`); returns `.docx` attachment
- `POST /resume/pdf` — same body; returns `.pdf` attachment; used by Generate/Evaluate/History **Download** when Settings **Download** is PDF and Resume Language is `en`
- Consumed by API (validation), web (display + download), and Vitest unit tests
- **DOCX template management** — architecture, default template, style tokens, and extension guide: [`docx-template-management.md`](./docx-template-management.md)
- **Workspace authoring** — how Company / Experience / Workflow fields should be written so assembly and the Generate Prompt can multiply scene × capability × rubric: [`workspace-authoring.md`](./workspace-authoring.md). `assembleFromCombineSnapshot` nests linked experiences under each Combine company; it does not de-duplicate stack variants. The default Generate Prompt treats `whatCompanyIs` as company scene grounding, `roleContext` as title hint, `keywordContext` as per-company steering at Generate, and each linked card as its own bullet(s) (`actions` lead, `outcome` close) with card isolation, cross-company metric dedup, and Skills 12–20 items from JD ∩ materials then materials-strong fill.

## Noise Filter (Phase 12)

- Module: `src/lib/noise-filter/` — pure TypeScript, synchronous, no network / LLM / DB
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
- Compatibility: `src/lib/jobNoiseFilter.ts` re-exports `JOB_TEXT_MAX` and `applyNoiseFilter` → `noiseFilter(input).text`
- Generate Job **Next** runs noise filter silently before `POST /ai-verdict` (no separate Noise Filter button)
- Tests: Vitest (`pnpm test`); per-filter unit tests + BIT / Golang Engineer regression fixture under `__tests__/`

## Docker (Phase 33 — optional LAN)

- **Image:** one container runs Next.js standalone (UI + in-process `/backend/*` API); platform `linux/arm64` for Docker Desktop on Apple Silicon
- **Files:** root `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`; ops guide [`docker.md`](./docker.md)
- **Publish:** `4321:4321` on all host interfaces (LAN access)
- **Web bind:** `HOSTNAME=0.0.0.0` in Compose
- **Database:** SQLite at `file:/data/johel.db` on named volume `johel-data`
- **Start:** entrypoint runs `prisma migrate deploy` at repo root, then starts Next on `:4321` (`WEB_PORT`)
- **Replace database:** copy a local SQLite file (e.g. `prisma/dev.db`) into `/data/johel.db` on `johel-data` — see [`docker.md`](./docker.md)
- **Secrets:** `JWT_SECRET` from root `.env` via Compose (not in image)

## CI/CD (Phase 94)

- Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): single **ci** job (test, lint, build); no Turso secrets in CI; no Docker build in CI
- CD: Vercel **Production** only (`main`); disable Preview deployments in Vercel Git settings; pending migrations applied during production build via [`migrate-deploy-turso.ts`](../scripts/migrate-deploy-turso.ts) (not Prisma CLI against `libsql://`)
- Operator runbook: [`ci-cd.md`](./ci-cd.md) (branch protection, rollback, local `pnpm test` parity)

## Vercel + Turso (Phase 93 — production)

- **Deploy:** Vercel **Root Directory** `.` + [`vercel.json`](../vercel.json); `pnpm build` runs Turso migrate script or `prisma migrate deploy`, then `next build`
- **Env checklist (Production):** [`vercel-deploy.md`](./vercel-deploy.md)
- **SQLite → Turso:** `scripts/backup-db.sh` → `scripts/prepare-sqlite-for-turso-import.sh` → `turso db import`
- **Plaintext API keys:** `pnpm db:migrate-keys` once after cutover if needed

## UI locale (Phase 50)

- **Storage:** `johel-locale` in `localStorage`; values `en` (default) or `ko`
- **Bootstrap:** `LOCALE_BOOTSTRAP_SCRIPT` in root layout `<head>` sets `document.documentElement.lang` before paint (alongside theme bootstrap)
- **Provider:** `LocaleProvider` (`components/app/LocaleProvider.tsx`) exposes `locale`, `setLocale`, `t`, `tLines`
- **Catalogs:** `src/messages/en.ts` (source of key shape), `ko.ts` (`MessageTree` via `DeepStringify<typeof en>`), `translate.ts` (`translate`, `translateLines`)
- **Settings:** `/settings/environment` Language section after Theme; toggles apply immediately (no Save)
- **Korean typography:** when `document.documentElement.lang` is `ko`, UI sans-serif uses bundled **KP CheonRiMa** (`src/fonts/KP-CheonRiMa-Medium.ttf` via `next/font/local` in `lib/ko-font.ts`); English keeps Geist Sans
- **Scope:** All JoHEL UI strings including login/register; not resume output language (Settings Generation) or server/API error text

## Architecture refactor (Phases 54–60, 2026-09-09)

**Supersedes** saved Workflow presets, Quick Experience (`ai-author-advise`), and AI Workflow Recommendation for current behavior. Historical phase notes below may still mention workflows.

### Generate timeline

`Job → Verdict? → Combine → Generate → Evaluate?` — controlled by `doVerdict` / `doEvaluate` on `generationProcess`.

### API additions / changes

- `POST /ai-experience-advise` — fact input → multi-op advisor (`create_experience` | `update_experience` | `need_more_facts`); Suggest embeds user facts, ranks pool by in-memory cosine against stored experience embeddings, and builds a tiered prompt (full STAR for expanded ids + compact index for **all** cards); pool depth from `generationProcess.experienceAdvisePoolDepth`; response includes `experiencesById`; `generateType: experienceAdvise` (+ `embedding` for query/backfill vectors)
- `POST /ai-experience-advise/apply` — body `{ workspaceFingerprint, operations[] }`; fingerprint stale → 409; persists create/update with deterministic STAR finalize (no `markdownFormat` AI)
- `POST /ai-combine-recommend` — body `{ generationId, companyId? }`; optional `companyId` scopes the request to one included Combine company; client **explicitly saves** the generation snapshot (`PUT /generations/:id`) immediately before Suggest; server loads `jobJson` (`filteredJobText` preferred), `verdictMarkdown`, and `combineJson` from `generations`; per-company max linked experiences from `generationProcess.combineExperiencesPerCompanyMax` (default 5, range 1–10; prompt pick rule and response cap); `experienceDimensionMode` from `generationProcess` steers cross-company capability differentiation; **JD tier decay** by Combine selection order (`100% × (decayPercent/100)^index`; default decay 80%) injected per company as `JD selection weight` (per-company suggest keeps index from full Combine order); each company entry includes `whatCompanyIs` from workspace; priority stack: company scene fit → role context cap → JD tier → keyword context (keyword steering × tier); per-company optional `keywordContext` (comma-separated, max 500 chars); empty → Auto; filled → keyword-guided; thin JD overlap → fewer cards + warnings; **AI I/O uses per-request ref tokens** (`C01`, `E01`, …); server maps refs to ids; `warnings` humanize `Cxx`/`Exx`; HTTP response returns `companies`, `warnings`, and `tokenUsed` only (no `usage.input`/`usage.output`); audit text stored via `recordAiUsage`; `generateType: combineRecommend`
- **AI POST response slimming (Phase 78)** — `POST /ai-verdict`, `/ai-resume`, `/ai-evaluate`, `/ai-experience-advise`, `/ai-combine-recommend`, and `/ai-check-on-experiences` return business fields + `tokenUsed` only; prompt input/output strings are persisted on `aiUsage` for History detail, not echoed in the POST response
- **Generation save (`filteredJobText`)** — `buildGenerationUpdatePayload` stores `job.filteredJobText` from client noise filter so server-side AI routes can use the same JD text without re-uploading job body
- `POST /ai-resume` — body `{ jobContext, combine }` where `combine.emphasis` is Run guidance for this run; each `combine.companies[]` entry may include optional `keywordContext` (max 500 chars), passed through `assembleFromCombineSnapshot` into the Generate user prompt (`Keyword context:` line per company, same Auto placeholder as Combine Suggest when empty); server attaches `generationPolicy` (`experienceDimensionMode`, `experienceJdTierDecayPercent`) from `generationProcess`; Generate execution rules and user prompt apply JD tier decay to Experience bullets only (Summary/Skills full JD), Summary naturalness rules, **company scene grounding** (`whatCompanyIs` per employer), role-context cap, and keyword priority within each company slot
- `POST /resume/combine-fingerprint` — fingerprint for Combine snapshot (replaces workflow fingerprint)
- `GET /auth/me` includes `role` (`admin` | `user`)
- `GET /prompts` returns system prompts and `*Extension` fields; `PUT /prompts/{kind}` accepts the system prompt and/or extension for any signed-in user
- Removed: `GET/POST /workflows`, `POST /ai-workflow-recommend`, `POST /ai-author-advise`, `PUT /settings/process/last-workflow`

### Schema

- Dropped: `workflows`, `workflowCompanies`, `workflowCompanyExperiences`; `generationProcess.doWorkflowRecommendation`, `workflowRecommendationThreshold`, `lastSelectedWorkflowId`
- Added: `generationProcess.resumeLanguage` (per-user default resume output language; migration `20260909100003_generation_resume_language`)
- Added: `experienceEmbeddings` table + `generationProcess.experienceAdvisePoolDepth` (migration `20260909100006_experience_embedding_pool_depth`)
- Added: `users.role` (default `user`); `prompts.verdictExtension`, `generateExtension`, `evaluateExtension`
- Migrations: `20260909100000_remove_workflows`, `20260909100001_user_role_prompt_extensions`

### Web

- `GenerateVerdictStep`, `GenerateCombineStep`, `combine-types.ts`, `CombineProfilePicker`, `CombineCompanyCards`, `CombinePeriodSlider`, `combine-period.ts`
- **PCE bundle (Phase 71, renamed Phase 72):** `GET /pce` returns `{ profiles, companies, experiences }` (unpaginated, same detail shapes as CRUD list items). Web `loadPce` / `usePce` cache one in-flight request and reuse data across Generate prerequisites, `CombineProfilePicker`, `CombineCompanyCards`, `GenerateCombineSummary`, and `CombineExperiencePickerDrawer`. **PCE** = Profile, Company, Experience (legacy **PCEW** / “workspace” naming removed). `usePce` subscribes to PCE invalidation and refetches when `invalidateWorkspaceCrudCaches` / `clearPceCache` runs (including cross-tab via `localStorage` signal).
- **Settings read cache (Phase 73):** `src/lib/cached-settings.ts` dedupes `GET /settings`, `GET /settings/process`, `GET /prompts`, and `GET /auth/me` across Settings pages, app layout, `GenerateStatusProvider`, and Generate bootstrap; caches update on save and clear on sign-out.
- **Workspace CRUD list cache (Phase 74):** `src/lib/cached-crud-list.ts` dedupes paginated `GET /profiles`, `GET /companies`, and `GET /experiences` by search + page; list effects depend on `[q, page]` only; `invalidateWorkspaceCrudCaches` clears list + PCE cache on profile/company/experience CRUD (including experience advise apply).
- Combine linked experiences: `experienceIds` array order is user-controlled (drag-and-drop on Combine step) and preserved through `assembleFromCombineSnapshot` into each company's `experiences[]` and the Generate prompt (`formatCompaniesSection` linked-experience block order)
- Combine step (Phase 81–82): all workspace companies as a single-column card list inside **Companies & Experiences**; when no companies are included, cards sort by **displayPriority** (1-based); when at least one is included, included cards follow **selection order** (`combine.companies` array order) and unselected cards follow **displayPriority** via `orderCompaniesForCombineDisplay`; company selection disabled until a profile is selected; per-card include toggle limited to checkbox + company name (only included entries in `combine.companies`); included rows show per-company **Suggest** (left of `ViewButton`) plus `ViewButton` → `CompanyDetailDialog`; dual-thumb `CombinePeriodSlider` (profile `graduationYear` + `graduationMonth` through current month; end at max = `Present`), inline role context, optional **Keyword context**, and linked experiences (`CombineCompanyExperienceList`: view/delete/manual add via `CombineExperiencePickerDrawer` drawer); **Suggest experiences** and **Reset** in the section title row; `useCombineExperienceSuggest` calls `POST /ai-combine-recommend` (all companies or one via `companyId`; per-company hybrid keyword context or Auto); confirm dialog before re-suggest (section-wide or per company when links/rationale exist); fullscreen `BusyOverlay` while suggesting; AI warnings once above cards; per-company rationale under experience list (session UI state from last suggest, not persisted in combine snapshot); Run notification below section after successful suggest in this session (cleared when profile or included-company set changes); Combine defaults (`localStorage`) remember profile, included companies (period, role/keyword context, **experienceIds**); deleted experience ids stripped on load via `sanitizeCombineSelection`; Combine **Profile** and **Companies & Experiences** share `COMBINE_SECTION_CLASS` bordered panels; period labels use `CombinePeriodDisplay` (`combine-period-display.ts`) — range in `text-foreground`, short inclusive duration in `text-muted` (e.g. `Jan 2025 – Present` `(1y 9m)`); step-bar **Run** uses `isCombineRunReady` (`runDisabled` on `GenerateStepNav`) until profile, companies, required fields, and at least one linked experience are ready
- Combine validation (`validateCombineSnapshot`): profile required with graduation year and month, ≥1 included company, each with period + role context; `isCombineRunReady` also requires ≥1 linked `experienceId` across included companies for step-bar **Run**
- **Combine context input performance:** Role context / Keyword context use local state in `CombineCompanyContextFields`; Run guidance uses local state in `CombineEmphasisField`; both debounce (~250ms) syncing into the session snapshot so keystrokes do not write session/local storage or re-render the Generate page on every character. Pending context and emphasis are flushed on blur and before Suggest / Run. Combine defaults (`localStorage`) persistence is debounced (~300ms).
- Migration `20260909100002_profile_education_split`: legacy `education` text copied to `university`; column dropped
- `POST /ai-resume` and `POST /resume/combine-fingerprint` accept `experienceIds: []` per company; `assembleFromCombineSnapshot` allows empty experiences per company
- Session: `combine: CombineSnapshot` instead of `workflow`
- Experiences: `ExperienceFactForm` (full page), `ExperienceSuggestionDialog`; **Quick Add Experience:** `QuickAddExperience` drawer reuses `useExperienceAdviseFlow`, `ExperienceFactFormFields`, `ExperienceSuggestionDrawer` (create-only; same `POST /ai-experience-advise` + apply as `/experiences/new`)
- `StudioBottomFabCluster`: Quick Add Experience plus FAB + AI Usage History FAB (column layout)
- Settings Prompts: each tab edits system prompt + optional extension; `compileInstruction` appends extensions

### Resume assembly

- `assembleFromCombineSnapshot()` in `src/server/lib/resume/assemble-input.ts` — maps Combine snapshot (including per-company `keywordContext`) to `ResumeGenerationInput`; fingerprint includes assembled companies so keyword changes invalidate resume reuse
- `ResumeGenerationInput.run` — `{ language, emphasis? }` replaces workflow block
- Default Generate Prompt (`@johel/prompt-defaults`) + `EXECUTION_RULES` in `src/server/lib/ai-resume/prompts.ts` — card-scoped bullets, tenure-safe tech wording, multi-cloud limits, one quantified outcome per resume, keyword steering, Skills 12–20, summary career-years lead; post-AI summary career-years finalize when the model omits it

## Generation history (Phase 62)

### Schema

- Prisma `Generation` → table `generations` (per user): `id`, `publicId`, `userId`, `finalized` (boolean; `true` when user downloaded the resume), denormalized `inputToken` / `outputToken`, snapshot fields (`activeStep`, `jobJson`, `combineJson`, `verdictMarkdown`, `resumeJson`, `evaluationMarkdown`, `doVerdict`, `doEvaluate`, `resumeLanguage`, snapshotted `verdictPrompt` / `generatePrompt` / `evaluatePrompt`), timestamps.
- `AiUsage.generationId` optional FK → `generations.id` (`onDelete: SetNull`); indexed
- Migrations: `20260909100004_generations`, `20260910100007_generation_finalized` (replaces `status` with `finalized` boolean)

### Public ID

- Format: `GEN-YYYYMMDD-NNN` (per user, per calendar day; `NNN` zero-padded sequence). Allocation scans existing `publicId` values for the day and uses max(`NNN`) + 1 (not row count); `POST /generations/start` retries on `(userId, publicId)` unique conflicts.

### API

- `POST /generations/start` — allocate `publicId`, snapshot current prompts + process flags, create row (`finalized: false`)
- `PUT /generations/:id` — upsert session snapshot (internal cuid); optional `finalized: true` (sticky once set); syncs `generationJobEmbeddings` when job text changes (Phase 79)
- `POST /generations/:id/job-duplicate-check` — embed current filtered JD, cosine-compare to other generations; threshold `0.90` (Phase 79)
- `POST /generations/:publicId/resume` — optional `archive` snapshot for the current run; sets target generation `finalized` to `false`; returns full detail for client session hydrate
- `GET /generations/current` — the user's **`users.currentGenerationId`** snapshot (includes finalized runs until **+ New** or **Resume from History** moves the pointer); restores Generate on login / Generate mount
- `GET /generations` — paginated list (`page`, `q`, pageSize 10); search `jobJson` + snapshotted prompt fields; newest first; each item includes `information` (`{profileName} · {jdCompanyName} · {jdJobRole}` from snapshotted `combineJson` + `jobJson`)
- `GET /generations/:publicId` — full snapshot for detail page
- Generation-scoped AI routes accept optional `generationId`; `recordAiUsage` links rows and increments generation token totals

### Persistence triggers

- **Start:** first Generate visit (or after **+ New**) calls `POST /generations/start` when `GET /generations/current` has no pointer (or no row)
- **Snapshot:** debounced `PUT` on session changes (job, combine, active step, resume, evaluation); `finalized: true` when user downloads resume DOCX
- **+ New:** `PUT` current run, clear session, `POST /generations/start` for fresh ID

### Web

- Generate page: Generation ID subtitle under title; session stores `generationId` / `generationPublicId`
- **Session restore:** Generate bootstrap always **`GET /generations/current`** (pointer + row snapshot + AI cache keys from snapshotted prompts); merge local overlay from `sessionStorage`; same-tab refresh re-fetches on mount (no live cross-device sync until reload / re-enter Generate)
- **Resume from History:** `GenerationHistoryDrawer` header uses round icon buttons (same chrome as Generate Run); Resume (play icon) opens confirm dialog; on confirm, archives current run via `POST /generations/:publicId/resume` (`archive` body when another run is active), moves **`currentGenerationId`**, hydrates target into React session, navigates to Generate; History **Current** mark and header use **`GET /auth/me`** `currentGenerationPublicId` / server pointer (not local storage)
- `/history` list (CRUD list pattern); columns include **Information** (profile + JD company + JD role) and **Updated At**; all Generation ID displays use `font-mono`; row click opens wide drawer (`80vw`) with read-only detail reusing `GenerateTimeline`, `GenerateStepLayout`, preview panels, and `GenerateHistoryStepView`; drawer `publicId` is local state (row click does not touch the URL — avoids `useSearchParams` / list reload); header deep links use `?publicId=` on first load; legacy `/history/[publicId]` redirects to query form
- Studio header center: **Current** label, active generation public ID (links to Generate `/`), plus `HistoryStepsCell` step pills (same styling as History list **Steps** column); logo-only brand link (no wordmark text)
- Sidebar **Run** → **History** after **Generate**

### AI Usage History grouping

- Drawer tabs (Phase 75): **All** (`GET /ai-usage`, ungrouped, newest first, 100/page); **Generation** (`GET /ai-usage/groups`, grouped by `generationId`, newest groups first, 50/page); **Other** (`GET /ai-usage?generationId=none`, unlinked rows only, ungrouped, newest first, 100/page)
- `GET /ai-usage/groups` — paginated generation-linked summaries only: `generationId`, `generationPublicId`, call count, token sums, `latestCreatedAt`
- `GET /ai-usage?generationId=` — filter call rows (`none` for unlinked / Other rows); omit `generationId` for All; list items include `generationId` and `generationPublicId`
- Generation tab expands a group to load nested call rows via `GET /ai-usage?generationId={id}&limit=null`

## AI prompt optimization (Phase 65+)

Tiered strategy to reduce redundant AI calls and prompt size (see Embedding + RAG review, 2026-09-09):

- **Tier 1 (Phase 65):** Experience advisor **Apply** skips `markdownFormat` — Suggest→Apply is one LLM call (`experienceAdvise`) plus deterministic STAR finalize on persist; direct `POST/PUT /experiences` still uses AI markdown format when fields change
- **Tier 2 (Phase 66):** Edit-mode tiered pool on Suggest — target card full STAR + compact index for other cards
- **Tier 2.5 (Phase 67):** Generalized tiered pool — index for **all** cards + full STAR for expanded set; `loadExperienceAdviseContext` (single query + SHA-256 fingerprint); Suggest returns `experiencesById`; company save one batched markdown call; direct experience CRUD uses deterministic finalize; modules under `src/server/lib/experience-pool-rank/` (keyword rank superseded by Phase 68 on Suggest)
- **Tier 3 (Phase 68):** Embedding retrieval — `text-embedding-3-small` in `experienceEmbeddings`; in-memory cosine top-K from `generationProcess.experienceAdvisePoolDepth` (`compact` 5 / `normal` 10 / `thorough` 25 / `full` all); edit target + recent N=3 always expanded; embedding upsert on experience save/apply; `generateType: embedding` in AI usage; **OpenAI-only** provider (Cursor removed)
- **Tier 3.5 (Phase 84):** Index truncation — pools with more than 20 cards cap the compact index by pool depth (`compact` 20 / `normal` 40 / `thorough` 80 index lines); index lists embedding-ranked non-expanded cards only (expanded cards omitted from index); **Full** depth skips the index (all cards already have full STAR); pools ≤20 cards index every non-expanded card
- **Tier 4 (Phase 79):** JD duplicate check before Verdict — `text-embedding-3-small` in `generationJobEmbeddings` (one row per generation with non-empty filtered JD); input prefers `filteredJobText` from `jobJson` (fallback `jobText`, max 10,000 chars); `sourceHash` (FNV-1a of trimmed text) skips re-embed when unchanged; in-memory cosine vs peer generations; threshold `0.90` (`JOB_DUPLICATE_SIMILARITY_THRESHOLD`); lazy backfill on check; sync on `PUT /generations/:id`; delete row when job text cleared; `generateType: embedding` with `generationId` for token roll-up

### JD duplicate check (Phase 79)

- **When:** Generate Job **Run** with **Do Verdict** on — after snapshot save, before Verdict navigation / `POST /ai-verdict`
- **API:** `POST /generations/:id/job-duplicate-check` (internal cuid) — returns `{ match: null }` or `{ match: { generationId, publicId, filteredJobText, finalized, score } }`; requires OpenAI API key; on failure client toasts and proceeds (advisory)
- **Module:** `src/server/lib/job-embedding/` (`build-input`, `upsert`, `sync-after-save`, `ensure-embeddings`, `duplicate-check`, `source-hash`, `constants`)
- **Web:** `useJobDuplicateFlow`, `GenerateJobDuplicateDialog`; session `jobDuplicateDismissedHash` (filtered JD hash) suppresses repeat dialog until Job text changes; **Cancel** / **Switch** call `clearJobAndPersist` (empty job + embedding delete via PUT sync)
- **Migration:** `20260910100008_generation_job_embeddings`

## Internet hardening (Phase 83)

Public deployment adds security and operability without paid SaaS. Plan: [`plans/2026-09-11-phase-83-internet-hardening.md`](./plans/2026-09-11-phase-83-internet-hardening.md).

### HTTPS

- TLS terminated by **Caddy** (or operator reverse proxy) in front of the existing app container
- Env: `PUBLIC_URL`, `TRUST_PROXY=true`; API CORS allows `PUBLIC_URL` when set
- Session cookie `secure: true` when HTTPS / trusted proxy

### Encrypted API keys

- `ENCRYPTION_KEY` (32-byte secret, base64 in env) — required for public deploy
- `src/server/lib/secrets/` — AES-256-GCM encrypt/decrypt; migrate existing plaintext rows
- All LLM routes read keys via `getUserApiKey(userId)` helper

### Rate limiting

- Hono middleware; keys by IP (auth) or `userId` (AI)
- Defaults: login 10/15m, register 5/h, AI 30/h per user; returns `429` + `Retry-After`
- In-memory store for single-container deploy (document shared store if scaling later)

### Session security

- `users.sessionVersion` embedded in JWT; increment on password change → stale tokens rejected
- Boot fails when `PUBLIC_DEPLOY=true` and `JWT_SECRET` / `ENCRYPTION_KEY` are weak or default
- Configurable `SESSION_TTL` (default 7d)

### Backups

- `scripts/backup-db.sh` / `scripts/restore-db.sh` — timestamped SQLite copies to `BACKUP_DIR`
- Documented in [`docker.md`](./docker.md); retention via `BACKUP_RETENTION_DAYS`

### Test coverage + CI

- `.github/workflows/ci.yml` — **ci** job (Prisma generate, Vitest, ESLint, `next build` with CI SQLite); no Docker image verify in CI
- Server tests under `src/server/**/__tests__` (auth, settings encryption, rate limit, deploy-config, AI lib units)
- Root `pnpm test` matches CI package + web test scope; details in [`ci-cd.md`](./ci-cd.md)

## Plans

Built Cursor plans for completed work are archived under [`docs/plans/`](./plans/) with a `YYYY-MM-DD-` filename prefix.

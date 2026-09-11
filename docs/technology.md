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
| API | **Hono** (standalone process) | Local API separate from UI; lightweight TypeScript server |
| UI | Next.js (App Router) + Tailwind CSS | Frontend only; no paid UI SaaS |
| Database | SQLite via Prisma | On-disk multi-user data; no hosted DB cost |
| Auth | Login ID + password on the **API**; JWT in httpOnly cookie | Multi-user local login; no Auth.js / OAuth IdP. API field `loginId`; DB column `users.email` stores the login ID (no email-format validation). |
| Secrets / API keys | Per-user `Setting.apiKey` — **AES-256-GCM at rest** when `ENCRYPTION_KEY` is set (Phase 83); plaintext only in local dev without the key | Masked on read; decrypt via `getUserAiSettings` |
| LLM | Provider interface; `@cursor/sdk` (Cursor) and `openai` SDK (OpenAI) in `apps/api` | User-owned keys; Anthropic adapters later |
| JD ingest (later) | Manual / URL (`fetch` + cheerio) / file (`pdf-parse`, `mammoth`) | No scraping or parse SaaS |
| Resume export | `docx`; `pdf-lib` (PDF) | Server-side generation on the API |
| Templates / formats (later) | Natural-language settings in SQLite via LLM prompts | Spec requirement |
| Package manager | pnpm workspaces | Monorepo (`apps/api`, `apps/web`) |
| Testing | Vitest; GitHub Actions CI (Phase 83) | Unit + auth/security integration tests; Playwright smoke deferred |

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
- Endpoints: `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `PUT /auth/password`, `GET /auth/me`, `GET /settings`, `PUT /settings`, `GET /settings/process`, `PUT /settings/process`, `PUT /settings/process/last-workflow`, `GET/POST /workflows`, `GET /workflows/:id/generation-fingerprint`, `GET/PUT/DELETE /workflows/:id`, `GET/POST /profiles`, `GET/PUT/DELETE /profiles/:id`, `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`, `GET/POST /experiences`, `GET/PUT/DELETE /experiences/:id`, `POST /ai-verdict`, `POST /ai-workflow-recommend`, `POST /ai-resume`, `POST /ai-evaluate`, `POST /ai-author-advise`, `POST /ai-author-advise/apply`, `POST /resume/docx`, `POST /resume/pdf`, `GET /ai-usage/summary`, `GET /ai-usage`, `GET /ai-usage/:id`, `GET /prompts`, `PUT /prompts/verdict`, `PUT /prompts/generate`, `PUT /prompts/evaluate`
- Prisma `User` → table `users`: `id`, `email` (login ID), `passwordHash`, `createdAt`, `updatedAt`
- **Phase 76:** `PUT /auth/password` `{ currentPassword, newPassword }` (min 8); verifies current hash then updates `passwordHash` only; `changePassword` in `apps/web/src/lib/api.ts`
- Prisma `Setting` → table `settings` (one per user): `id`, `userId`, `provider`, `apiKey`, `createdAt`, `updatedAt`
- Prisma `Workflow` → table `workflows` (per user): `id`, `userId`, `profileId?` (FK → `profiles`), `name`, `description?`, `language`, `createdAt`, `updatedAt` (no `usedCount`, no `metadataJson`, no `verdictPrompt`)
- Prisma `WorkflowCompany` → table `workflowCompanies`: `id`, `workflowId`, `companyId`, `startDate`, `endDate`, `roleContext`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowId, companyId)`; cascade delete with workflow
- Prisma `WorkflowCompanyExperience` → table `workflowCompanyExperiences`: `id`, `workflowCompanyId`, `experienceId`, `sortOrder`, `createdAt`, `updatedAt`; unique `(workflowCompanyId, experienceId)`; cascade delete with workflow company row
- Prisma `Profile` → table `profiles` (per user): `id`, `userId`, `firstName`, `lastName`, `birthDate?` (`YYYY-MM-DD`), `email?`, `pn?`, `residence?`, `university?`, `graduationYear` (required on write), `graduationMonth` (required on write, 1–12), `degree?`, `createdAt`, `updatedAt`
- Prisma `ProfileLink` → table `profileLinks`: `id`, `profileId`, `key`, `link?`, `sortOrder`, `createdAt`, `updatedAt`; unique `(profileId, key)`; cascade delete with profile
- Prisma `Company` → table `companies` (per user): `id`, `userId`, `displayPriority`, `alias`, `name`, `whatCompanyIs`, `domainAndStack`, `createdAt`, `updatedAt`
- Prisma `Experience` → table `experiences` (per user): `id`, `userId`, `category`, `problem`, `actions`, `outcome`, `createdAt`, `updatedAt`
- Prisma `AiUsage` → table `aiUsage` (per user): `id`, `userId`, `aiProvider`, `modelName`, `generateType`, `inputToken`, `outputToken`, `input`, `output`, `createdAt`
- Prisma `Prompt` → table `prompts` (one per user): `id`, `userId` (unique), `verdictPrompt`, `generatePrompt`, `evaluatePrompt`, `createdAt`, `updatedAt`
- Prisma `GenerationProcess` → table `generationProcess` (one per user): `id`, `userId` (unique), `doVerdict`, `doEvaluate`, `resumeLanguage`, `downloadFormat`, `experienceAdvisePoolDepth`, `createdAt`, `updatedAt`; defaults `doVerdict`/`doEvaluate` true, `resumeLanguage` `en`, `downloadFormat` `docx`, `experienceAdvisePoolDepth` `normal`
- **Phase 36:** `PromptOptimization` / `promptOptimizations` and `usePromptOptimizationAi` removed; AI routes use deterministic `compileInstruction` only (see `apps/api/src/lib/prompt-optimize/compile.ts`)
- SQLite table names are case-insensitive, so PascalCase (`User`) cannot be renamed to single-word camelCase (`user`). Tables use plural / compound camelCase: `users`, `settings`, `generationProcess`, `workflows`, ...
- **Convention:** all physical table names are camelCase via Prisma `@@map` (never PascalCase table names)
- **Migrations:** squashed to a single migration `20260908100000_init` (2026-09-08). Fresh installs and Docker entrypoint use `prisma migrate deploy`. If a database already applied the pre-squash migration history, reset before deploy: local `pnpm --filter api exec prisma migrate reset` (or delete `apps/api/prisma/dev.db` and run `migrate deploy`); Docker `docker compose down -v` then `docker compose up -d` (wipes `johel-data`)

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
- Action controls: `AddButton` (plus), `EditButton` (pencil), `DeleteButton` (red trash), `CopyButton` (clipboard), `CloseButton` (X) in `components/shared/action-icon-buttons.tsx`
- Dialogs use `DetailDialog` (`components/shared/detail-dialog.tsx`) so Close (X) is always in the top-right header; the footer holds only the main action (Apply / Delete). Do not put Close beside that action. `mode="view"` (default) allows backdrop dismiss; `mode="form"` blocks backdrop dismiss for add/edit dialogs. Delete confirms use `mode="view"`. See `.cursor/rules/dialog-dismiss.mdc`.
- Drawers use shared `Drawer` (`components/shared/drawer.tsx`): stay mounted through open/close; panel `translate3d(100% → 0)` plus backdrop fade, 420ms `cubic-bezier(0.32, 0.72, 0, 1)` (velocity ease-out); unmount after the transition; `prefers-reduced-motion: reduce` skips the motion. Nested drawers (history + detail) each run this animation independently. Primary actions (Suggest, Apply, pagination, etc.) use the optional `footer` prop so they stay pinned below the scrollable body; Close remains in the header.

## Studio shell (Phase 4)

- Layout: top bar + left sidebar + main content (full-height studio chrome)
- Components: `components/app/StudioHeader`, `components/app/StudioSidebar`; theme via `ThemeProvider` + `johel-theme` in `localStorage`; UI locale via `LocaleProvider` + `johel-locale` in `localStorage` (`en` default, `ko`); FAB & drawer side via `DrawerPositionProvider` + `johel-drawer-position` in `localStorage` (`right` default, `left`); bootstrap script in root layout sets `document.documentElement.lang` before paint; message catalogs in `apps/web/src/messages/` (`en.ts`, `ko.ts`, `translate.ts`); components use `useT()` / `useLocale()` from `LocaleProvider`; sidebar open/collapsed via `johel-sidebar` in `localStorage` (`open` default, `collapsed`). Hamburger in the header toggles `StudioSidebar` with a slide (`transform` + width, same `--drawer-duration` / `--drawer-ease` as drawers; first paint skips motion so stored collapsed state does not animate). `aria-controls="studio-sidebar"`.
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
- Header also shows `Token Used: {formatTokenUsed(n)}` beside the email; raw count is the user’s aggregated `aiUsage` total (`inputToken + outputToken`)
- **Global FAB cluster (Phase 32, 41, 63, 75):** fixed bottom-right vertical stack (`StudioBottomFabCluster`): **Quick Add Experience** plus FAB (above) opens `QuickAddExperience` drawer; history (clock) FAB opens AI Usage History `Drawer` with **All** / **Generation** / **Other** tabs; suggestion preview uses nested `ExperienceSuggestionDrawer` (z-index 60). AI Usage History row click opens nested detail `Drawer` with **Input** / **Output** tabs; `listAiUsage` / `listAiUsageGroups` / `getAiUsage` in `apps/web/src/lib/api.ts`
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

- `GET /settings/process` → `{ doVerdict, doEvaluate, resumeLanguage, downloadFormat, experienceAdvisePoolDepth }` (defaults: Verdict/Evaluate true, `resumeLanguage` `en`, `downloadFormat` `docx`, `experienceAdvisePoolDepth` `normal`)
- `PUT /settings/process` → same fields; `resumeLanguage` is one of `en`, `ja`, `zh-TW`, `zh-CN`, `ko`; `downloadFormat` is `docx` or `pdf` (coerced to `docx` when `resumeLanguage` is not `en`); upsert by `userId`; returns saved values
- Web Settings **Generation** page (`/settings/generation`): **Process**, **Resume Language**, **Download** (DOCX / PDF radios; PDF disabled unless Resume Language is `en`), and **Experience advisor pool depth**; one **Save** persists all; toast on API result; saving changed Process flags, resume language, or pool depth clears in-progress Generate session; changing download format alone does not
- Generate / Evaluate / History **Download** reads saved `downloadFormat` via `useResumeDownload` and `resolveDownloadFormat` (English-only guard at download time)
- Generate reads process settings on load; syncs `combine.language` from saved `resumeLanguage`; Verdict Prompt prerequisite only when `doVerdict`; Evaluate Prompt only when `doEvaluate`
- When `doVerdict` is false: Job **Next** skips `POST /ai-verdict`; Workflow hides verdict panel; resume generation uses noise-filtered job description as `jobContext`
- When `doVerdict` is true: Workflow shows AI Verdict result; resume generation and evaluation send that Markdown as `jobContext` instead of the raw job description (Verdict Prompt structure and extracted fields affect tailoring quality)
- When `doEvaluate` is false: timeline is Job → Workflow → Generate; Generate **Download** is last-step action; Evaluate step hidden; stored `activeStep: "Evaluate"` normalizes to Generate on load
- When `doWorkflowRecommendation` is true: after Job **Next** (with or without Verdict), Generate calls `POST /ai-workflow-recommend` unless session `workflowRecommendInputKey` matches; auto-selects workflow when score ≥ threshold; otherwise clears selection and toasts; when false, restores `lastSelectedWorkflowId` without AI

## Prompt compile (Phase 29, revised Phase 36, 40)

- Module: `apps/api/src/lib/prompt-optimize/` — `compileInstruction`, `PROMPT_SECTION_SEPARATOR`, `PROMPT_COMPILER_VERSION` (`2`); `extractMarkdownHeadings` / `formatJobContextBlock` in `job-context.ts`
- **Deterministic compile (always):** trim, collapse extra blank lines, wrap stored prompt markdown under `# Instructions`, then append `PROMPT_SECTION_SEPARATOR` (`----------------------------------------`)
- **Runtime system prompt:** compiled Instructions + `# Execution rules` (minimal provider-safe rules) + separator + provider notes; Verdict / Generate / Evaluate output structure and tailoring rules live in the user's stored prompt, not in fixed system sections
- **Run guidance:** Combine `emphasis` is sent in the user message under `## Run intent` as `Run guidance:` (replaces the former separate One-time Prompt on the system prompt)
- Generate cache keys (`buildVerdictInputKey`, `buildGenerationInputKey`, `buildEvaluationInputKey`, `buildWorkflowRecommendInputKey`) include prompt hashes via `apps/web/src/lib/prompt-hash.ts` (no optimization flag); Generate/Evaluate keys also include `labeledUserMessageVersion` so a user-message layout change invalidates stored AI results

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
- `POST /companies` / `PUT /companies/:id` — `{ displayPriority, alias, name, whatCompanyIs, domainAndStack }` where `displayPriority` is a 1-based integer; on write, `whatCompanyIs` and `domainAndStack` are converted to markdown via AI when changed since last save (create always converts); unchanged fields skip conversion; requires Settings provider/apiKey when conversion runs
- Search `q` across alias, name, whatCompanyIs, and domainAndStack
- Web routes: `/companies` list (columns: Display Priority, Alias, Company Name, What this company is, Domain & Stack); `/companies/new` add; `/companies/[id]/edit` edit; editor fields in order: display priority, alias, company name, what this company is, domain & stack; English guidelines and good/bad examples on the two prompt fields; shared guidance that personal achievements belong in shared experiences
- **Phase 44 migration note:** `companies.description` dropped; existing rows backfill `alias` and `name` from former `name`, `whatCompanyIs` from former `description`, `domainAndStack` to empty string — users must fill domain & stack on next edit
- **Display priority migration:** existing companies receive sequential 1-based priorities per user ordered by former `name` sort

## Experiences (Phase 10, 30, 45)

- `GET /experiences?q=&page=` — page size 10
- List order: `category` ascending (same order in the workflow experience picker, which uses the same list API)
- `GET /experiences/:id` — full detail for the editor (owner only)
- `POST /experiences` / `PUT /experiences/:id` — `{ category, problem, actions, outcome }` (all required); on write, changed STAR fields are converted to markdown via **one batched AI call** (`formatExperienceFieldsOnSave`) when any of the three differ from stored values (create always converts); all unchanged → skip conversion; requires Settings provider/apiKey when conversion runs
- `POST /ai-experience-advise/apply` — persists advisor create/update operations; STAR fields use **deterministic finalize only** (`finalizeExperienceFieldsForAdvisorApply` in `apps/api/src/lib/ai-experience-advise/apply.ts`: `finalizeExperienceFieldsOnSave` + length/empty validation); **no** `markdownFormat` AI call on Apply (Phase 65)
- Search `q` across category, problem, actions, and outcome
- Web routes: `/experiences` list (columns: Category, Problem, Actions, Outcome); `/experiences/new` add; `/experiences/[id]/edit` edit; editor shows bullet-format guidelines and examples on problem/actions/outcome and shared guidance on one card = one capability unit; `DESCRIPTION_AS_RESUME_PROMPT_HINT` on each prompt field; Save right-aligned
- **Phase 45 migration note:** `experiences.description` dropped; existing rows backfill `problem` from former `description`, `actions` and `outcome` to empty string — users must fill actions on next edit

## CRUD list pagination and history back (Phase 53)

- List pages (`/profiles`, `/companies`, `/experiences`, `/workflows`) sync pagination and search to URL query params: `?page=` (omitted when `1`) and `?q=` (omitted when empty); pagination updates use `router.replace` (no extra history entry per page click)
- Hook: `useCrudListParams` in `apps/web/src/lib/crud-list-params.ts`; list content wrapped in `Suspense` (required for `useSearchParams`)
- Add/edit forms use `useCrudFormNavigation(fallbackHref)` and `BackButton` with `preferHistoryBack` so Back, Cancel, and post-save navigation call `router.back()` when history exists, else `router.push(fallbackHref)`

## Generate UI (Phase 11–20, 22, 24, 25, 26, 27, 28)

- Route `/` gates on at least one Profile, Company, and Experience plus saved Generate Prompt; Verdict Prompt required only when `doVerdict`; Evaluate Prompt required only when `doEvaluate`; otherwise a centered alert with links (not a toast)
- Timeline steps: Job → **Verdict** (when `doVerdict`) → **Combine** → Generate, plus **Evaluate** when `doEvaluate` is true
- Page layout: full main content width (`-m-6` on the page section to cancel main padding; no `max-w-4xl`); section height `calc(100dvh - 3.5rem)` (app header) with `overflow-hidden` so step columns scroll independently
- Two-column step body via `GenerateStepLayout`: left panel = read-only previous-step preview (`useGeneratePreviousStepPanel` + `GenerateJobDescriptionPreview`, `AiVerdictMarkdown`, `GenerateCombineSummary`, or `ResumeMarkdown`); right panel = current step; both panel cards share the same header chrome (`text-sm` title, optional `headerRight`, `border-b`) and `bg-surface`; both cards `h-full` so they stretch to the row height; each column `overflow-y-auto` with fixed panel header; stacked on narrow viewports (`max-h-[50vh]` per section). **Job** step sets `swapColumns` + `currentFill`: Job input on the left (textarea fills remaining panel height), filtered preview on the right with filtered character count in the panel header (`previousHeaderRight`). Current-step titles come from `getGenerateCurrentPanelTitle`.
- Sticky header: page title row includes **New** (plus icon + label) to reset the in-progress Generate session to a blank Job step; step row (`GenerateTimeline` + `GenerateStepNavRunButton`) uses `sticky top-0`; `bg-background` and bottom border
- Step navigation (Phase 64): timeline steps are **clickable** for browse-only navigation (`onStepSelect` → `setActiveStep`); **Run** (play icon, right gutter) advances to the next step and executes AI when applicable; **Previous** removed — use timeline to go back; steps register handlers via `useRegisterGenerateStepNav` (`onRun`, `onDownload`)
- Job UI (Manual): optional **JD Company Name** and **JD Job Role** fields (persisted in `jobJson`); Job text max 10,000 chars + right **Run** only; URL and File tabs show an info alert (“not implemented yet / coming soon”)
- Job **Run**: inline validation if JD empty; clears downstream resume/evaluation (confirm when stale); when `doVerdict`, navigates to Verdict and runs `POST /ai-verdict` (reuses stored verdict when `verdictInputKey` matches); when `!doVerdict`, clears verdict and navigates to Combine
- Verdict **Run**: navigates to Combine (no AI)
- Combine **Run**: validates snapshot; clears downstream resume/evaluation (confirm when stale); navigates to Generate and runs `POST /ai-resume` (reuses when `generationInputKey` matches)
- Generate: `GenerateGenerateStep` renders `resumeToMarkdown(resume)` via `ResumeMarkdown`; **Run** (when `doEvaluate`) navigates to Evaluate and runs `POST /ai-evaluate` (confirm when evaluation exists; reuses when `evaluationInputKey` matches); **Download** on this step when `doEvaluate` is false
- Evaluate: `GenerateEvaluateStep` renders evaluation Markdown via `AiVerdictMarkdown`; **Download** calls `POST /resume/docx` with stored JSON
- One Generate **process** spans Job through resume download; session persists after download until **New** or until Settings **Process** flags change (Do Verdict / Do Evaluate saved with different values)
- In-progress Generate run persisted in `sessionStorage` per user (`johel:generate-session:{userId}`): active timeline step, Job state, Combine snapshot (including Run guidance / `emphasis`), `verdictInputKey`, `resume` JSON, `generationInputKey` fingerprint (job + combine + server combine fingerprint), `evaluationMarkdown`, and `evaluationInputKey`; legacy `oneTimePrompt` session keys migrate into `combine.emphasis` on load; **editing Job/Combine or Quick Add Experience does not clear cached results until the user Run**s from an earlier step (confirm dialog when resume/evaluation would be discarded); `clearDownstreamFromVerdict` / `clearDownstreamFromGenerate` in `generate-session.ts`; no mount auto-run (`useStepMountAutoRun` removed from AI steps)
- Last Combine **profile** and included **companies** (period, role context, keyword context) remembered per user in `localStorage` (`johel:combine-defaults:{userId}`) via `apps/web/src/lib/combine-defaults.ts`; updated on every `setCombine`; seeded when **+ New** allocates a generation or when the current generation has an empty Combine selection; deleted profile/company ids stripped in `GenerateCombineStep`; **Run guidance** and `experienceIds` are not remembered
- List APIs (`GET /workflows`, etc.): `page=null` or `limit=null` returns all matching items
- Token display: `formatTokenUsed` in `apps/web/src/lib/tokens.ts` (delegates to `formatThousandsSeparated` in `apps/web/src/lib/helper.ts`); all user-visible numbers use thousand-separated formatting; header from `GET /ai-usage/summary`
- Components under `apps/web/src/components/generate/` (`GenerateJobStep`, `GenerateWorkflowStep`, `GenerateGenerateStep`, `GenerateEvaluateStep`, `GenerateStepNav`, `PceSection`); workflow editor uses `WorkflowProfilePicker`, `WorkflowCompaniesEditor`, and `WorkflowCompanyDialog`

## AI Verdict (Phase 13, 19, 40)

- `POST /ai-verdict` — body `{ jobDescription }` (1–10,000 chars; client sends noise-filtered text); requires saved Settings provider/apiKey and non-empty `prompts.verdictPrompt`; system prompt = compiled `# Instructions` (user Verdict Prompt) + `# Execution rules` (Markdown-only, follow Instructions, Not found); returns `{ markdown, usage, tokenUsed }`
- `GET /ai-usage/summary` — `{ tokenUsed }` = sum of `inputToken + outputToken` for the user; optional `generationId` query returns tokens for that generation only (from `generations.inputToken` + `outputToken`); `sumTokenUsed` in `apps/api/src/lib/sum-token-used.ts`
- `GET /ai-usage?page=` — owner-only paginated list; page size **100**; `orderBy: { createdAt: "desc" }`; returns `{ items, total, page, pageSize }` where each item has `id`, `aiProvider`, `modelName`, `generateType`, `inputToken`, `outputToken`, `createdAt` (omits `input` / `output`)
- `GET /ai-usage/:id` — owner-only detail including `input` and `output`; 404 when missing or not owned
- Each `aiUsage` row stores `modelName` and `generateType` via `recordAiUsage` (`apps/api/src/lib/record-ai-usage.ts`): active `generateType` values are `verdict`, `generate`, `evaluate`, `workflowRecommend`, `markdownFormat`, and `authorAdvise` (UI label **Quick Experience**); historical rows may still have `promptHelper` (label **Prompt Helper** in AI Usage History); `modelName` is `auto` for Cursor, `gpt-5.6-luna` for OpenAI verdict/evaluate/workflow-recommend/author-advise, `gpt-5.6-sol` for OpenAI markdown-format, `gpt-5.6-terra` for OpenAI resume generation
- Provider adapter under `apps/api/src/lib/ai-verdict/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Markdown output structure is **user-defined** in the Verdict Prompt (default template seeded on sign-up); JoHEL does not enforce fixed `## Verdict` / `## Job` / `## Company` sections
- Web: `runAiVerdict` in `apps/web/src/lib/api.ts`; Job step fullscreen loading; Workflow step renders result with `AiVerdictMarkdown` (`react-markdown` + `@tailwindcss/typography` theme tokens); `AiUsageProvider` refreshes header total after success
- **Note:** Phase 13 introduced this as `POST /ai-filter`; Phase 19 renamed to `ai-verdict` and wired into Generate Job **Next**

## Prompts settings (Phase 18, 23, 34, 39, 40, 43)

- `GET /prompts` → `{ verdictPrompt, generatePrompt, evaluatePrompt }` — empty strings when no row yet (owner only); new sign-ups receive defaults from `@johel/prompt-defaults` via `POST /auth/register` (Verdict default uses Role / Technical Requirements / Final Verdict sections; Generate default maps those headings and caps skills at 3–5 groups and 12 items; Evaluate default scores the same Verdict dimensions)
- `PUT /prompts/verdict` → body `{ verdictPrompt }`; `PUT /prompts/generate` → `{ generatePrompt }`; `PUT /prompts/evaluate` → `{ evaluatePrompt }` (each trim, min 1, max 10,000 chars); upsert by `userId`; on write, only the submitted prompt is converted to markdown via AI when changed (unchanged skip conversion); requires Settings provider/apiKey when conversion runs; each endpoint returns all three prompts
- Web route `/settings/prompts`: **Verdict**, **Generate**, and **Evaluate** tabs (`?tab=verdict|generate|evaluate`, default Verdict); page copy states that system prompt changes directly affect resume generation quality; each tab shows one read-only `AiVerdictMarkdown` preview (muted placeholder when empty); **Edit** (pencil) opens `PromptEditDialog` (textarea + **Apply**, local until that tab’s **Save**); auto-markdown notice and resume-context hints where applicable; fullscreen `BusyOverlay` when conversion runs; per-tab **Reset to Default** (secondary, confirm dialog, persists `@johel/prompt-defaults` for that tab) and **Save** (always enabled; inline validation on submit); toast on API result; refreshes header Token Used after save
- Legacy web routes `/prompts` and `/verdict` redirect to `/settings/prompts`
- Company editor form (`CompanyForm`): alias, company name, what this company is, and domain & stack; prompt fields show auto-markdown notice; fullscreen `BusyOverlay` when conversion runs; detail dialog renders prompt fields with `AiVerdictMarkdown`. Experience editor form (`ExperienceForm`): Description textarea with the same auto-markdown behavior.
- Client: `getPrompts`, `savePrompt` in `apps/web/src/lib/api.ts`; placeholders in `apps/web/src/lib/prompts.ts`
- Verdict Prompt consumed by `POST /ai-verdict`; Generate Prompt consumed by `POST /ai-resume`; Evaluate Prompt consumed by `POST /ai-evaluate`

## AI Markdown Format (Phase 38, 40)

- Embedded in `PUT /prompts/verdict`, `PUT /prompts/generate`, `PUT /prompts/evaluate`, `POST/PUT /companies`, `POST/PUT /experiences` write handlers (no separate endpoint); **not** used on `POST /ai-experience-advise/apply` (advisor Apply uses deterministic finalize only — Phase 65)
- Module: `apps/api/src/lib/ai-markdown-format/` — `formatMarkdownOnSave` helper; `formatExperienceFieldsOnSave` batches `problem` / `actions` / `outcome` into one AI call (JSON response, then per-field finalize); kinds `verdict` | `generate` | `evaluate` | `companyWhatItIs` | `companyDomainAndStack` | `experienceProblem` | `experienceActions` | `experienceOutcome`
- Skip rule: when `submitted.trim() === stored.trim()`, persist without AI (no API key required); prompt kinds still run deterministic `#`→`##` heading cap on save
- When changed: requires Settings provider/apiKey; AI converts text to structured markdown (preserve meaning, fold `## New` helper blocks, no invented content); **prompt kinds** additionally require `##` as the largest heading (AI rule + `capPromptHeadings` post-process); **structured list kinds** (`experienceProblem`, `experienceActions`, `experienceOutcome`, `companyDomainAndStack`) format each item as a bullet with a bold label and indented body, strip accidental `#` headings and field-type metadata; strips accidental code fences; rejects empty or over-limit output
- Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`); OpenAI via `runOpenAiMarkdownFormatResponse` (`gpt-5.6-sol`, reasoning `low`); usage stored as `generateType: "markdownFormat"`; AI Usage History label **Markdown Format**
- Prompts: changed fields convert in parallel before upsert
- Web: `AUTO_MARKDOWN_FORMAT_HINT` in `apps/web/src/lib/markdown-format.ts`; `BusyOverlay` during save when client detects changed fields; `refreshTokenUsed` after successful save
- Independent of Settings Process flags

## AI Workflow Recommendation (Phase 36)

- `POST /ai-workflow-recommend` — body `{ jobDescription, acceptedMarkdown? }` (job 1–10,000 chars noise-filtered text; optional verdict markdown); requires saved Settings provider/apiKey and ≥1 owned workflow; loads workflow summaries (name, description, language, profile name, deduplicated flat `experiences` with id/category/problem/actions/outcome, company periods with `experienceIds` referencing that list); AI returns structured `{ matches: [{ workflowId, score }] }` (scores 0–100); server picks highest score and applies user’s `workflowRecommendationThreshold` from `generationProcess`; returns `{ workflowId, workflowName, score, threshold, usage, tokenUsed }` where `workflowId` is null when best score is below threshold
- Module: `apps/api/src/lib/ai-workflow-recommend/` — prompts, `parse-response`, `pickRecommendedWorkflow`, Cursor/OpenAI provider adapters; summaries via `loadWorkflowRecommendSummaries`
- Web: `runAiWorkflowRecommend` in `apps/web/src/lib/api.ts`; Generate page runs after Job **Next** when `doWorkflowRecommendation`; session caches via `buildWorkflowRecommendInputKey` + `workflowRecommendInputKey`; manual workflow row select calls `PUT /settings/process/last-workflow`

## AI Resume (Phase 20, 22, 23, 28)

- `POST /ai-resume` — body `{ jobContext, workflowId, oneTimePrompt? }` where `jobContext` is AI Verdict Markdown when the client ran Verdict, otherwise noise-filtered job description text (1–10,000 chars); requires saved Settings provider/apiKey and non-empty `prompts.generatePrompt`; server loads the owned workflow (profile, ordered company entries with period and linked experiences) and assembles generation input; system prompt = compiled user Generate Prompt + optional `## One-time prompt` section when `oneTimePrompt` is non-empty + shared resume rules (use Job context as rubric; map missing Instruction headings to the closest sections present; JSON-style field names in Instructions map to labeled subsections); user prompt is labeled Markdown (`## Job context` with a heading list, `## Workflow intent`, `## Profile`, `## Companies (resume order)`) — not a JSON dump of the assembled input; ids and company alias are omitted; empty optional profile/outcome fields are skipped; returns `{ resume, usage, tokenUsed }` where `resume` is validated `GeneratedResume` JSON
- `GET /workflows/:id/generation-fingerprint` — returns `{ fingerprint }` where `fingerprint` is a stable JSON string of the assembled profile, nested companies (with period and linked experiences), and workflow fields (same source as `assembleResumeGenerationInput`, excluding job text); used by Generate to detect PCE edits without re-running AI on unchanged content
- Provider adapter under `apps/api/src/lib/ai-resume/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-terra`, reasoning `medium`, JSON output); response parsed as JSON only and validated with Zod from `@johel/resume`
- Web: `runAiResume` in `apps/web/src/lib/api.ts`; Workflow **Next** fullscreen loading; session stores `resume` + `generationInputKey`; Generate step renders Markdown; Evaluate step downloads DOCX without re-calling AI when inputs are unchanged

## AI Evaluate (Phase 25)

- `POST /ai-evaluate` — body `{ jobContext, resume }` (`jobContext` 1–10,000 chars; same text as Generate: Verdict Markdown when Do Verdict ran, otherwise noise-filtered job description; `jobDescription` accepted as a fallback field name; `resume` validated `GeneratedResume`); requires saved Settings provider/apiKey and non-empty `prompts.evaluatePrompt`; system prompt = compiled user Evaluate Prompt + `# Execution rules` (labeled Job context then Resume; use Verdict headings as rubric when present, otherwise derive the same dimensions) + provider notes; user prompt is labeled Markdown (`## Job context` with a heading list, then `## Resume`); server converts resume to Markdown via `resumeToMarkdown`; returns `{ markdown, usage, tokenUsed }`
- Provider adapter under `apps/api/src/lib/ai-evaluate/`; Cursor via `@cursor/sdk` `Agent.prompt` (model `auto`, local `cwd`); OpenAI via `openai` SDK Responses API (`gpt-5.6-luna`, reasoning `low`)
- Web: `runAiEvaluate` in `apps/web/src/lib/api.ts` (`jobContext` from `buildResumeJobContext`); Generate **Next** fullscreen loading; session stores `evaluationMarkdown` + `evaluationInputKey` (generation fingerprint plus evaluate prompt hash and `labeledUserMessageVersion`); Evaluate step renders result with `AiVerdictMarkdown`

## Quick Experience authoring advisor (Phase 49)

- `POST /ai-author-advise` — body `{ workflowId?, userFacts }` (facts 1–10,000 chars); requires Settings provider/apiKey; loads workspace graph via `loadAuthorAdviseGraph`: when `workflowId` is set, only that workflow’s profile, company entries, and linked experiences (`assembleResumeGenerationInput`); when omitted, every owned workflow with the same shape (never-linked workspace cards excluded); fixed system prompt encodes [`workspace-authoring.md`](./workspace-authoring.md) routing (including no employer names in Experience STAR drafts); for update placements, AI returns delta-only draft fields (new content only; unchanged fields `null`); user message = scope + workflow blocks + user facts (no Job/Evaluate session); Cursor `Agent.prompt` / OpenAI Responses `json_object` (`gpt-5.6-luna`); returns `{ proposal, workspaceFingerprint, usage, tokenUsed }`; fingerprint is `buildWorkflowGenerationFingerprint` for one workflow or JSON array of per-workflow fingerprints when scope is all
- `POST /ai-author-advise/apply` — body `{ workflowId?, workspaceFingerprint, proposal, draft? }`; deterministic Prisma writes in `applyAuthorAdviseProposal` (experience/company create or update, workflow link, role context, workflow description); stale fingerprint → 409; uses existing `formatMarkdownOnSave` on changed markdown fields; returns `{ ok, appliedWorkflowId, warnings }`
- Module: `apps/api/src/lib/ai-author-advise/` (`load-graph`, `fingerprint`, `prompts`, `parse-response`, `merge-experience-field`, `apply`, Cursor/OpenAI providers)
- Web merge (Phase 51–52): for all update placements (`update_experience`, `update_company`, `update_role_context`, `update_workflow_description`), `QuickExperience` loads existing stored text and merges each changed field with the AI delta via `mergeExperienceFieldUpdate` / `buildAuthorAdviseDisplayDraft` before showing the Suggestion drawer; Apply sends the merged textarea as `draft` (WYSIWYG replace, no server-side append)
- Web: `StudioBottomFabCluster` (history + plus FABs); `QuickExperience` drawer + nested `QuickExperienceSuggestionDrawer`; `runAuthorAdvise` / `applyAuthorAdvise` in `apps/web/src/lib/api.ts`; Apply dispatches `johel:workspace-updated` (`workspace-updated.ts`); `useGenerateSession` clears stored resume/evaluation when the event affects the session workflow or is a shared company/experience update

## Resume package (`@johel/resume`, Phase 20)

- Workspace package: `packages/resume`
- Canonical model: `GeneratedResume` (Zod schema in `domain/generated-resume.ts`)
- `resumeToMarkdown(resume)` — deterministic Markdown for web display (main export); section order matches the default DOCX template: Header, Summary, Experience, Skills, Education, Certifications, Projects
- `buildResumeExportFileName({ publicId?, jdCompanyName?, jdJobRole?, exportDate? }, format)` — `{YYYYMMDD} - {NN} - {JD Company Name} - {JD Job Role}.{docx|pdf}` where `{NN}` is the zero-padded sequence parsed from `GEN-YYYYMMDD-NNN` public IDs (fallback `00`); segments preserve readable text with unsafe filename characters stripped
- `@johel/resume/docx` — `buildResumeDocxBuffer` / `buildResumeDocxBlob` (server/Node); section builders under `docx-builder/sections/` and `docx-builder/templates/default.ts` (same section order as Markdown); shared `ResumeDocxStyle` in `docx-builder/styles.ts` (default font Arial)
- `@johel/resume/pdf` — `buildResumePdfBuffer` / `buildResumePdfBlob` via `pdf-lib` (Helvetica; English-only product constraint; no CJK font embedding); A4 page size; `PdfLayout` reads page dimensions from each `PDFPage` so margins align with the rendered page; same section order as DOCX under `pdf-builder/templates/default.ts`; `filterPdfText` drops characters outside Standard Font WinAnsi before layout so mixed Unicode in resume JSON does not fail generation
- `POST /resume/docx` — body `{ resume, runLabel? }` (validated `GeneratedResume`); returns `.docx` attachment
- `POST /resume/pdf` — same body; returns `.pdf` attachment; used by Generate/Evaluate/History **Download** when Settings **Download** is PDF and Resume Language is `en`
- Consumed by API (validation), web (display + download), and Vitest unit tests
- **DOCX template management** — architecture, default template, style tokens, and extension guide: [`docx-template-management.md`](./docx-template-management.md)
- **Workspace authoring** — how Company / Experience / Workflow fields should be written so assembly and the Generate Prompt can multiply scene × capability × rubric: [`workspace-authoring.md`](./workspace-authoring.md). `assembleResumeGenerationInput` nests linked experiences under each workflow company; it does not de-duplicate stack variants. The default Generate Prompt treats `whatCompanyIs` / `domainAndStack` as scene, `roleContext` as title hint, and each linked card as 1–3 bullets (`actions` lead, `outcome` close).

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

## Docker (Phase 33)

- **Image:** one container runs API (Hono) + web (Next.js standalone); platform `linux/arm64` for Docker Desktop on Apple Silicon
- **Files:** root `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`; ops guide [`docker.md`](./docker.md)
- **Publish:** `4444:4444` on all host interfaces (LAN access); API listens on `127.0.0.1:4042` inside the container only (`HOST` env on API)
- **Web bind:** `HOSTNAME=0.0.0.0` in Compose (Docker sets `HOSTNAME` to the container name; Next standalone must override)
- **Proxy:** `API_ORIGIN=http://127.0.0.1:4042` for `/backend/*` route handler
- **Database:** SQLite at `file:/data/johel.db` on named volume `johel-data` (Docker Desktop VM — do not bind-mount to macOS for SQLite)
- **Start:** entrypoint runs `prisma migrate deploy`, starts API, waits for `GET /health`, then starts Next on `:4444` (`WEB_PORT`)
- **Update image:** rebuild and `docker compose up -d --force-recreate` (never `down -v`); Case B also uses `docker save` / `docker load` between Macs
- **Replace database:** copy a local SQLite file (e.g. `apps/api/prisma/dev.db`) into `/data/johel.db` on `johel-data` — see [`docker.md` — Replace the Docker database with a local file](./docker.md#replace-the-docker-database-with-a-local-file)
- **Secrets:** `JWT_SECRET` from root `.env` via Compose (not in image)
- **Next build:** `output: "standalone"` and `outputFileTracingRoot` in `apps/web/next.config.ts` for monorepo tracing; image build copies workspace packages `packages/resume` and `packages/prompt-defaults`
- **pnpm in Docker:** `pnpm install --store-dir /pnpm/store` with pnpm **9.15.9** in the image (pnpm 12 blocks build scripts without approve-builds)

## UI locale (Phase 50)

- **Storage:** `johel-locale` in `localStorage`; values `en` (default) or `ko`
- **Bootstrap:** `LOCALE_BOOTSTRAP_SCRIPT` in root layout `<head>` sets `document.documentElement.lang` before paint (alongside theme bootstrap)
- **Provider:** `LocaleProvider` (`components/app/LocaleProvider.tsx`) exposes `locale`, `setLocale`, `t`, `tLines`
- **Catalogs:** `apps/web/src/messages/en.ts` (source of key shape), `ko.ts` (`MessageTree` via `DeepStringify<typeof en>`), `translate.ts` (`translate`, `translateLines`)
- **Settings:** `/settings/environment` Language section after Theme; toggles apply immediately (no Save)
- **Korean typography:** when `document.documentElement.lang` is `ko`, UI sans-serif uses bundled **KP CheonRiMa** (`apps/web/src/fonts/KP-CheonRiMa-Medium.ttf` via `next/font/local` in `lib/ko-font.ts`); English keeps Geist Sans
- **Scope:** All JoHEL UI strings including login/register; not resume output language (Settings Generation) or server/API error text

## Architecture refactor (Phases 54–60, 2026-09-09)

**Supersedes** saved Workflow presets, Quick Experience (`ai-author-advise`), and AI Workflow Recommendation for current behavior. Historical phase notes below may still mention workflows.

### Generate timeline

`Job → Verdict? → Combine → Generate → Evaluate?` — controlled by `doVerdict` / `doEvaluate` on `generationProcess`.

### API additions / changes

- `POST /ai-experience-advise` — fact input → multi-op advisor (`create_experience` | `update_experience` | `need_more_facts`); Suggest embeds user facts, ranks pool by in-memory cosine against stored experience embeddings, and builds a tiered prompt (full STAR for expanded ids + compact index for **all** cards); pool depth from `generationProcess.experienceAdvisePoolDepth`; response includes `experiencesById`; `generateType: experienceAdvise` (+ `embedding` for query/backfill vectors)
- `POST /ai-experience-advise/apply` — body `{ workspaceFingerprint, operations[] }`; fingerprint stale → 409; persists create/update with deterministic STAR finalize (no `markdownFormat` AI)
- `POST /ai-combine-recommend` — body `{ generationId, companyId? }`; optional `companyId` scopes the request to one included Combine company; client **explicitly saves** the generation snapshot (`PUT /generations/:id`) immediately before Suggest; server loads `jobJson` (`filteredJobText` preferred), `verdictMarkdown`, and `combineJson` from `generations`; per-company optional `keywordContext` (comma-separated, max 500 chars); empty → Auto; filled → keyword-guided; thin JD overlap → fewer cards + warnings; **AI I/O uses per-request ref tokens** (`C01`, `E01`, …); server maps refs to ids; `warnings` humanize `Cxx`/`Exx`; HTTP response returns `companies`, `warnings`, and `tokenUsed` only (no `usage.input`/`usage.output`); audit text stored via `recordAiUsage`; `generateType: combineRecommend`
- **AI POST response slimming (Phase 78)** — `POST /ai-verdict`, `/ai-resume`, `/ai-evaluate`, `/ai-experience-advise`, and `/ai-combine-recommend` return business fields + `tokenUsed` only; prompt input/output strings are persisted on `aiUsage` for History detail, not echoed in the POST response
- **Generation save (`filteredJobText`)** — `buildGenerationUpdatePayload` stores `job.filteredJobText` from client noise filter so server-side AI routes can use the same JD text without re-uploading job body
- `POST /ai-resume` — body `{ jobContext, combine }` where `combine.emphasis` is Run guidance for this run
- `POST /resume/combine-fingerprint` — fingerprint for Combine snapshot (replaces workflow fingerprint)
- `GET /auth/me` includes `role` (`admin` | `user`)
- `GET /prompts` returns `*Extension` fields; `PUT /prompts/{kind}/extension` for all users; full prompt `PUT` for admins only
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
- **Settings read cache (Phase 73):** `apps/web/src/lib/cached-settings.ts` dedupes `GET /settings`, `GET /settings/process`, `GET /prompts`, and `GET /auth/me` across Settings pages, app layout, `GenerateStatusProvider`, and Generate bootstrap; caches update on save and clear on sign-out.
- **Workspace CRUD list cache (Phase 74):** `apps/web/src/lib/cached-crud-list.ts` dedupes paginated `GET /profiles`, `GET /companies`, and `GET /experiences` by search + page; list effects depend on `[q, page]` only; `invalidateWorkspaceCrudCaches` clears list + PCE cache on profile/company/experience CRUD (including experience advise apply).
- Combine linked experiences: `experienceIds` array order is user-controlled (drag-and-drop on Combine step) and preserved through `assembleFromCombineSnapshot` into each company's `experiences[]` and the Generate prompt (`formatCompaniesSection` linked-experience block order)
- Combine step (Phase 81–82): all workspace companies as a single-column card list inside **Companies & Experiences**; when no companies are included, cards sort by **displayPriority** (1-based); when at least one is included, included cards follow **selection order** (`combine.companies` array order) and unselected cards follow **displayPriority** via `orderCompaniesForCombineDisplay`; company selection disabled until a profile is selected; per-card include toggle limited to checkbox + company name (only included entries in `combine.companies`); included rows show per-company **Suggest** (left of `ViewButton`) plus `ViewButton` → `CompanyDetailDialog`; dual-thumb `CombinePeriodSlider` (profile `graduationYear` + `graduationMonth` through current month; end at max = `Present`), inline role context, optional **Keyword context**, and linked experiences (`CombineCompanyExperienceList`: view/delete/manual add via `CombineExperiencePickerDrawer` drawer); **Suggest experiences** and **Reset** in the section title row; `useCombineExperienceSuggest` calls `POST /ai-combine-recommend` (all companies or one via `companyId`; per-company hybrid keyword context or Auto); confirm dialog before re-suggest (section-wide or per company when links/rationale exist); fullscreen `BusyOverlay` while suggesting; AI warnings once above cards; per-company rationale under experience list (session UI state from last suggest, not persisted in combine snapshot); Run notification below section after successful suggest in this session (cleared when profile or included-company set changes); Combine defaults (`localStorage`) remember profile, included companies (period, role/keyword context, **experienceIds**); deleted experience ids stripped on load via `sanitizeCombineSelection`; Combine **Profile** and **Companies & Experiences** share `COMBINE_SECTION_CLASS` bordered panels; period labels use `CombinePeriodDisplay` (`combine-period-display.ts`) — range in `text-foreground`, short inclusive duration in `text-muted` (e.g. `Jan 2025 – Present` `(1y 9m)`); step-bar **Run** uses `isCombineRunReady` (`runDisabled` on `GenerateStepNav`) until profile, companies, required fields, and at least one linked experience are ready
- Combine validation (`validateCombineSnapshot`): profile required with graduation year and month, ≥1 included company, each with period + role context; `isCombineRunReady` also requires ≥1 linked `experienceId` across included companies for step-bar **Run**
- **Combine context input performance:** Role context / Keyword context use local state in `CombineCompanyContextFields`; Run guidance uses local state in `CombineEmphasisField`; both debounce (~250ms) syncing into the session snapshot so keystrokes do not write session/local storage or re-render the Generate page on every character. Pending context and emphasis are flushed on blur and before Suggest / Run. Combine defaults (`localStorage`) persistence is debounced (~300ms).
- Migration `20260909100002_profile_education_split`: legacy `education` text copied to `university`; column dropped
- `POST /ai-resume` and `POST /resume/combine-fingerprint` accept `experienceIds: []` per company; `assembleFromCombineSnapshot` allows empty experiences per company
- Session: `combine: CombineSnapshot` instead of `workflow`
- Experiences: `ExperienceFactForm` (full page), `ExperienceSuggestionDialog`; **Quick Add Experience:** `QuickAddExperience` drawer reuses `useExperienceAdviseFlow`, `ExperienceFactFormFields`, `ExperienceSuggestionDrawer` (create-only; same `POST /ai-experience-advise` + apply as `/experiences/new`)
- `StudioBottomFabCluster`: Quick Add Experience plus FAB + AI Usage History FAB (column layout)
- Settings Prompts: admin full edit vs user extensions; `compileInstruction` appends extensions

### Resume assembly

- `assembleFromCombineSnapshot()` in `apps/api/src/lib/resume/assemble-input.ts`
- `ResumeGenerationInput.run` — `{ language, emphasis? }` replaces workflow block

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
- `GET /generations/current` — latest non-finalized run for the user (newest `updatedAt`); used to restore Generate session after logout/login
- `GET /generations` — paginated list (`page`, `q`, pageSize 10); search `jobJson` + snapshotted prompt fields; newest first; each item includes `information` (`{profileName} · {jdCompanyName} · {jdJobRole}` from snapshotted `combineJson` + `jobJson`)
- `GET /generations/:publicId` — full snapshot for detail page
- Generation-scoped AI routes accept optional `generationId`; `recordAiUsage` links rows and increments generation token totals

### Persistence triggers

- **Start:** first Generate visit (or after **+ New**) calls `POST /generations/start` when neither `sessionStorage` nor `GET /generations/current` has a restorable run
- **Snapshot:** debounced `PUT` on session changes (job, combine, active step, resume, evaluation); `finalized: true` when user downloads resume DOCX
- **+ New:** `PUT` current run, clear session, `POST /generations/start` for fresh ID

### Web

- Generate page: Generation ID subtitle under title; session stores `generationId` / `generationPublicId`
- **Session restore:** `sessionStorage` (`johel:generate-session:{userId}`) is the fast path for same-tab refresh; on login with empty storage, `GET /generations/current` hydrates the in-progress run (including AI cache keys from snapshotted prompts)
- **Resume from History:** `GenerationHistoryDrawer` header uses round icon buttons (same chrome as Generate Run); Resume (play icon) opens confirm dialog; on confirm, archives current session via `POST /generations/:publicId/resume` (`archive` body when another run is active), hydrates target into `sessionStorage`, navigates to Generate
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
- **Tier 2.5 (Phase 67):** Generalized tiered pool — index for **all** cards + full STAR for expanded set; `loadExperienceAdviseContext` (single query + SHA-256 fingerprint); Suggest returns `experiencesById`; company save one batched markdown call; direct experience CRUD uses deterministic finalize; modules under `apps/api/src/lib/experience-pool-rank/` (keyword rank superseded by Phase 68 on Suggest)
- **Tier 3 (Phase 68):** Embedding retrieval — `text-embedding-3-small` in `experienceEmbeddings`; in-memory cosine top-K from `generationProcess.experienceAdvisePoolDepth` (`compact` 5 / `normal` 10 / `thorough` 25 / `full` all); edit target + recent N=3 always expanded; embedding upsert on experience save/apply; `generateType: embedding` in AI usage; **OpenAI-only** provider (Cursor removed)
- **Tier 4 (Phase 79):** JD duplicate check before Verdict — `text-embedding-3-small` in `generationJobEmbeddings` (one row per generation with non-empty filtered JD); input prefers `filteredJobText` from `jobJson` (fallback `jobText`, max 10,000 chars); `sourceHash` (FNV-1a of trimmed text) skips re-embed when unchanged; in-memory cosine vs peer generations; threshold `0.90` (`JOB_DUPLICATE_SIMILARITY_THRESHOLD`); lazy backfill on check; sync on `PUT /generations/:id`; delete row when job text cleared; `generateType: embedding` with `generationId` for token roll-up

### JD duplicate check (Phase 79)

- **When:** Generate Job **Run** with **Do Verdict** on — after snapshot save, before Verdict navigation / `POST /ai-verdict`
- **API:** `POST /generations/:id/job-duplicate-check` (internal cuid) — returns `{ match: null }` or `{ match: { generationId, publicId, filteredJobText, finalized, score } }`; requires OpenAI API key; on failure client toasts and proceeds (advisory)
- **Module:** `apps/api/src/lib/job-embedding/` (`build-input`, `upsert`, `sync-after-save`, `ensure-embeddings`, `duplicate-check`, `source-hash`, `constants`)
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
- `apps/api/src/lib/secrets/` — AES-256-GCM encrypt/decrypt; migrate existing plaintext rows
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

- `.github/workflows/ci.yml` — install, api test, web test, lint, web build
- API integration tests: auth, settings encryption, rate limit, owner isolation
- `.github/workflows/ci.yml` — install, Prisma generate, api test, web test, web lint, web build
- Integration: `apps/api/src/routes/__tests__/auth-security.test.ts` (encrypted settings, session invalidation)

### Backups

- `scripts/backup-db.sh` — SQLite backup to `BACKUP_DIR` (default `./backups`); Docker or local dev DB
- `scripts/restore-db.sh` — restore with `RESTORE` confirmation prompt
- `BACKUP_RETENTION_DAYS` (default 14) prunes old files

## Plans

Built Cursor plans for completed work are archived under [`docs/plans/`](./plans/) with a `YYYY-MM-DD-` filename prefix.

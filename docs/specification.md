# Project: Customized Resume / CV and Résumé Builder

## Purpose

**JoHEL** is a customized Resume / CV and résumé writing application. It helps a user combine personal profile data, companies, shared hands-on experience, and a saved workflow preset to process a Job Description and generate a tailored résumé.

## Philosophy

**JoHEL does not guarantee or take responsibility for output quality.**

Result quality depends entirely on the user's prompt authoring and the capabilities of the AI provider they configure. JoHEL provides tooling to compose, store, compile, and run prompts—it does not warrant the suitability, accuracy, completeness, or effectiveness of AI-generated outputs. Users are free to define their own prompt structure and instructions; what the AI produces is between the user and their chosen model.

## Product concept

### What the user owns

* **Profiles** — One user can manage **multiple profiles** (personal identity variants used when generating).
* **Companies** — One user can manage **multiple companies** (alias, name, what this company is, and domain & stack — all required; used as resume-generation prompts).
* **Shared Experiences** — One user can add and update their working / hands-on experiences as a **shared** pool used across generations (not tied to a single profile alone). Each experience has a required category, required problem, required actions, and optional outcome used as resume-generation prompts.
* **Workflows** — One user can manage **multiple workflows**. Each workflow is a named preset that bundles one profile, one or more ordered company entries (each with a required employment period and linked shared experiences), a resume output language, and a required description used as a resume-generation prompt.
* **Prompts** — Per-user **Verdict Prompt**, **Generate Prompt**, and **Evaluate Prompt**, used when checking Job Descriptions, generating résumés, and evaluating résumés. New accounts receive default prompt templates on sign-up; users may replace them freely. Output structure and instructions are user-defined; JoHEL does not guarantee AI output quality (see **Philosophy**).

### End-to-end flow

A generation run combines:

**one Workflow** (profile + ordered company entries with linked experiences) → **Job Description** → **Filtering** → **Workflow** → **Generate** → **Evaluate**

```text
Workflow (one of many; includes Profile + ordered Companies with Experiences)
        |
        v
Job Description → Filtering → Workflow → Generate → Evaluate
```

1. **Job Description** — Provide the JD (URL, file, or manual input) and filter it.
2. **Workflow** — Choose one workflow; its saved profile and company entries (each with period and linked experiences) are used for generation.
3. **Generate** — Generate the résumé from the filtered JD and the selected workflow.
4. **Evaluate** — Score the generated résumé against the job description from an ATS perspective, then download the résumé.

## Deployment

* Local deployment (development: `pnpm dev:api` + `pnpm dev:web`)
* **Docker Desktop** — one combined image (API + web). Port **4041** is published so other devices on the LAN can use the app. The container may run on **this machine** or **another machine** on the LAN; the **database stays on whichever machine runs the container** when the image is replaced. See [`docs/docker.md`](./docker.md).

## Requirements

* The project is **not intended for monetization**.
* Users should be able to configure the templates and formats used by the main features using natural language.
* The project must **not incur any additional costs from external services** during operation.

## Main Features

* Users manage **multiple profiles**, **companies**, **shared experiences**, and **multiple workflows**.
* Users can provide a **Job Description** through:

  * URL input
  * File upload
  * Manual input
* A Job Description may contain not only the job details but also various information and links related to:

  * The website where the job was posted
  * The company that posted the job
  * Other relevant information
* The Job Description can contain up to **10,000 characters**.

### Job Description Processing

Aligned with the product flow above:

1. Process and filter the Job Description.
2. Run **AI Verdict** using the user’s saved Verdict Prompt; the user defines sections (e.g. fit questions, job extraction, company extraction), answer format, and Markdown output structure.
3. Allow the user to review the AI Verdict result on the Workflow step.
4. Generate a Resume based on:

   * The profile and company entries (each with period and linked experiences) saved in the selected workflow
   * **Job context for tailoring:** when **Do Verdict** is enabled, the accepted **AI Verdict** Markdown (replacing the raw job description); when **Do Verdict** is disabled, the noise-filtered job description from the Job step. Verdict Prompt sections and extracted fields directly affect what the generator sees and thus resume quality.
   * The workflow’s resume output language
5. Allow the user to review and edit the generated Resume.
6. Allow the user to download the final Resume as:

   * PDF
   * DOCX

#### Filtering layers

* **Noise Filter** — A deterministic preprocessing layer that removes irrelevant web-page noise before AI processing, reducing input size and token usage while preserving meaningful job and company information.
* **AI Filter** — An AI-based **AI Verdict** layer that analyzes the cleaned text using the user’s Verdict Prompt. The user defines what to extract, what to answer, and how to format the Markdown output.

## Key Metrics / Requirements

* Support **multiple users**.
* Each user can manage **multiple profiles**.
* Each user can manage **multiple companies**.
* Each user can manage **shared working / hands-on experiences**.
* Each user can manage **multiple workflows**.
* Users can manage their own **API keys**.
* Users can log in using their **email address**.
* Currently, the application uses a **Cursor API Key**.
* In the future, the application should support other LLM providers such as:

  * OpenAI
  * Anthropic
  * Other LLM providers

## Development Pipeline

* Do **not** define all specifications from the beginning.
* Develop the project incrementally in small units.
* Define **one Phase and its content at a time** — do not pre-define a full phase roadmap.
* When a Phase is performed and finished, mark it as **finished** (checked) in this document.
* As Phases complete, **this documentation grows** — add outcomes, decisions, and any new product specifications that emerged during the Phase.
* Repeatedly go through the following cycle:

**Requirements Definition → Review → Development → Testing → Repeat**

## User Interface

* The authenticated web UI uses a **studio** layout.
* **Dark theme** is the default; users can switch between **Dark** and **Light**.
* **Top header**
  * Left: project title **JoHEL**
  * Right: **Token Used** (compact K / M / G / T, e.g. `0.3K`, `12.5K`, `0.6M`) beside the user email dropdown containing **Profile** and **Sign out**
* **Left sidebar** menus:
  * **Workspace** (always-open submenus)
    * Profiles
    * Companies
    * Experiences
    * Workflows
    * Prompts
  * **Run** (always-open submenus)
    * Generate (`/` is Generate)
  * Settings
* **Profiles**
  * One signed-in user can manage **multiple** profiles
  * Per-user list: No, Full Name (first + last), birth date, email, PN, links, residence, education
  * Keyword filter on name parts, email, PN, residence, education; 10 rows per page
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole profile
  * Links add/edit/delete is local on the page until Save persists the profile (same pattern as workflow Metadata)
  * Editor fields: first name (required), last name (required), birth date, email, PN, residence, education (optional); links table (Key required; Value/link optional)
  * Distinct from header menu **Profile** (account email page)
* **Companies**
  * One signed-in user can manage **multiple** companies
  * Per-user list: No, Alias, Company Name, What this company is (truncated), Domain & Stack (truncated)
  * Keyword filter on alias, name, what this company is, and domain & stack; 10 rows per page
  * List is ordered by Company Name
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole company
  * Editor fields in order: alias (required), company name (required), what this company is (required; used as a resume-generation prompt), domain & stack (required; used as a resume-generation prompt)
  * What this company is shows guideline *(One sentence: industry, product, customer)* with good and bad examples; domain & stack shows guideline *(What they handle, tech, regulation/scale — bullets)* with good and bad examples; shared note that personal achievements belong in shared experiences because the same experience can link to multiple companies
  * What this company is and domain & stack show a notice that they are used as prompts during resume generation and that contents will be automatically converted to markdown format on **Save**; when a field changed since last save, **Save** runs AI markdown conversion (requires a configured AI Agent) before persisting; unchanged fields skip conversion; fullscreen loading while conversion runs; the detail dialog renders both fields as Markdown
  * Required editor fields show a red asterisk; Save stays available; empty required fields show an error under the input
* **Shared Experiences**
  * One signed-in user maintains a **shared** set of working / hands-on experiences used across generations with any selected profile and workflow
  * Per-user list: No, Category, Problem, Actions
  * Keyword filter on category, problem, actions, and outcome; 10 rows per page
  * List is ordered by most recently updated first
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole experience
  * Editor fields: category (required; free-text), problem (required; used as a resume-generation prompt), actions (required; used as a resume-generation prompt), outcome (optional; used as a resume-generation prompt)
  * Problem shows guideline *(What you solved)*; actions shows guideline *(What you did (verb + object) and the tech/methods used)*; outcome shows guideline *(Measurable result — include numbers only when you have them)*; shared note that one card should represent one capability unit for better synthesis
  * Problem, actions, and outcome show a notice that they are used as prompts during resume generation and that contents will be automatically converted to markdown format on **Save**; when a field changed since last save, **Save** runs AI markdown conversion (requires a configured AI Agent) before persisting; unchanged fields skip conversion; empty outcome skips conversion; fullscreen loading while conversion runs; the detail dialog renders all three fields as Markdown
  * Required editor fields show a red asterisk; Save stays available; empty required fields show an error under the input
* **Workflows**
  * One signed-in user can manage **multiple** workflows
  * Each workflow saves one profile, one or more ordered company entries (each with required employment period and linked experiences), and a resume output language
  * Per-user list: name, optional one-line description, updated
  * Keyword filter on name and description; 10 rows per page
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole workflow
  * Editor fields: name (required), description (required; used as a resume-generation prompt), language (English default; Japanese; Chinese Taiwan; Chinese Mainland; Korean)
  * Below the scalar fields, **Profile** (single row selection table: all items loaded at once; row click selects; View opens read-only detail dialog)
  * **Companies** section: ordered list of entries built one at a time; **Add** (plus icon) opens a dialog to pick one company, set required **Start** and **End** period (free-text), required **Role Context** (nature of the role held in this employment; not personal achievements), and multi-select one or more shared experiences; **Save** in the dialog validates inline and adds or updates the entry; row **Edit** (pencil) and **Delete** (red trash); company order is résumé order (first added = highest priority); the same shared experience may appear under multiple companies
  * Company-entry edits stay local until page **Save** (same pattern as profile Links)
  * Page Save validates inline: one profile; at least one company entry; each entry has startDate, endDate, roleContext, and at least one experience (not via disabling Save)
  * Detail dialog shows the selected profile and companies grouped with period and linked experiences (preserve company order)
  * Required editor fields show a red asterisk; Save stays available; empty required fields show an error under the input
* **Prompts** (`/prompts`)
  * Page content is centered in a readable column
  * One signed-in user maintains a **Verdict Prompt**, a **Generate Prompt**, and an **Evaluate Prompt**; **sign-up** seeds all three from shared default templates (`@johel/prompt-defaults`)
  * **Tabs** — **Verdict**, **Generate**, and **Evaluate**; each tab shows one prompt only (`?tab=verdict|generate|evaluate`; default Verdict)
  * Editor fields: each tab’s prompt (required) is shown as a read-only Markdown preview (`AiVerdictMarkdown`); empty prompts show a muted placeholder
  * Each tab has its own **Edit** (pencil) control beside the label; **Edit** opens a dialog with a textarea and **Apply** (local until that tab’s **Save**)
  * Each tab shows a notice that contents will be automatically converted to markdown format on **Save**; prompt kinds (Verdict / Generate / Evaluate) are capped at `##` as the largest heading during conversion, with deterministic `#`→`##` post-processing; when a prompt changed since last save, **Save** runs AI markdown conversion (requires a configured AI Agent) before persisting; unchanged prompts skip conversion but still receive heading-cap post-processing; fullscreen loading while conversion runs; saved preview refreshes with the converted markdown
  * Each tab’s **Save** persists only that prompt; **Save** stays enabled; required labels show a red asterisk; empty prompts show inline errors on Save (not a toast)
  * Load all prompts via `GET /prompts`; save per tab via `PUT /prompts/verdict`, `PUT /prompts/generate`, or `PUT /prompts/evaluate`; toast on API success or failure
  * The Verdict Prompt is used when checking Job Descriptions; when **Do Verdict** is enabled its Markdown output replaces the raw job description as job context for resume generation (Verdict structure and extracted fields affect resume quality); the Generate Prompt is used when generating résumés; the Evaluate Prompt is used when evaluating résumés (none run on this page)
* **Generate** (`/`)
  * Before the flow starts, the page checks that the user has at least one Workflow and saved **Generate Prompt**; **Verdict Prompt** is required only when **Do Verdict** is enabled in Settings; **Evaluate Prompt** is required only when **Do Evaluate** is enabled. If any are missing, a centered alert lists what is missing with links to the matching Prompts tab
  * When ready, a timeline shows steps: Job → Workflow → Generate, and **Evaluate** when **Do Evaluate** is enabled; the page **title**, **timeline**, and round **Previous** / **Next** (or **Download** on the last step) controls share one sticky header row—the timeline sits between the side buttons—and the header stays fixed at the top of the scroll area while step content scrolls beneath
  * **Next** on Job (Manual): validates the Job Description (inline error if empty); when **Do Verdict** is enabled, runs **Noise Filter** silently in the background (textarea unchanged), calls **AI Verdict** with the user’s saved Verdict Prompt (compiled under `# Instructions` with minimal execution rules), fullscreen loading while the request runs, on success persists token usage, saves accepted Markdown, toasts success, then advances toward **Workflow**; when **Do Verdict** is disabled, advances toward **Workflow** without calling AI Verdict; on failure stays on Job and toasts the error
  * Before **Workflow**, when **Do Workflow Recommendation** is enabled in Settings, runs **AI Workflow Recommendation** using the noise-filtered Job Description and accepted Verdict Markdown when present; fullscreen loading while the request runs; auto-selects the best-matching workflow only when its score meets the user’s **Recommendation threshold** (otherwise clears selection and toasts); when recommendation is disabled, restores the user’s last manually selected workflow if it still exists; recommendation results are cached in the Generate session when Job and Verdict inputs are unchanged
  * **Workflow** step: read-only **AI Verdict result** Markdown panel at the top when **Do Verdict** is enabled (from the accepted Job-step result); then a **Workflow** section with a single-select table (all workflows loaded at once; no search or pagination). Row click selects and persists the last manual choice for reuse when recommendation is off; View opens read-only workflow detail. Below the workflow table, an optional **One-time Prompt** textarea (8 rows) accepts run-specific instructions; when non-empty, it is appended to the saved Generate Prompt for that run’s resume generation only (stored in the Generate session, not on the Prompts page). **Previous** and **Next** in the sticky step row return to Job and advance respectively; **Next** stays enabled and validates inline (one workflow selected) before advancing
  * **Workflow** **Next** runs **AI Resume generation** with job context (AI Verdict Markdown when **Do Verdict** is enabled, otherwise the noise-filtered job description), selected workflow, saved Generate Prompt, and optional One-time Prompt when provided; fullscreen loading while generation runs; on success stores the generated resume JSON in the session, persists token usage, toasts success, and advances to **Generate**; on failure stays on Workflow and toasts the error; if the same inputs already produced a resume in this session, **Next** reuses the stored result without calling the AI again
  * An in-progress Generate run (step, Job inputs, accepted AI Verdict result, workflow selection, optional One-time Prompt, generated resume JSON, and evaluation result) is remembered for the signed-in user across refresh and navigation until the run is finished or reset to an empty Job step
  * **Generate** step: shows the generated resume as Markdown derived from the stored resume JSON (section order: Summary, Experience, Skills, Education, then optional Certifications and Projects); **Previous** in the sticky step row returns to Workflow; when **Do Evaluate** is enabled, **Next** runs **AI Evaluate** with the noise-filtered Job Description, stored resume, and saved Evaluate Prompt, fullscreen loading while evaluation runs, persists token usage, stores the evaluation Markdown, toasts success, and advances to **Evaluate**; when **Do Evaluate** is disabled, **Download** exports the stored resume JSON to a `.docx` file; on evaluation failure stays on Generate and toasts the error; if the same resume already has a stored evaluation in this session, **Next** reuses it without calling the AI again
  * **Evaluate** step (only when **Do Evaluate** is enabled): shows the AI evaluation as Markdown; **Previous** returns to Generate; **Download** exports the stored resume JSON to a `.docx` file without regenerating the resume or re-running evaluation
* **Settings**
  * Page content is centered in a readable column
  * Theme (Dark / Light)
  * **Process**: **Do Verdict**, **Do Evaluate**, and **Do Workflow Recommendation** checkboxes (Verdict and Evaluate default on; Workflow Recommendation default off); when **Do Workflow Recommendation** is enabled, **Recommendation threshold** (integer 0–100, default 70) is shown and validated inline on Save (Save stays enabled); Save persists per user; controls which optional AI steps run during Generate; changing any Process flag or threshold resets an in-progress Generate session
  * **AI Agent**: provider (**Cursor AI Agent** or **OpenAI**) and the user’s **API key**
  * A saved API key is shown only in part (first and last four characters), never in full
* **AI Usage History** — A fixed bottom-right round button (history / clock icon) on every authenticated page opens a right-side drawer with the user’s AI usage history table. Columns: No, AI, Model, Generate Type, Input Token, Output Token, Created At. Newest first; 100 rows per page with pagination stuck to the bottom of the drawer. Clicking a row opens a nested overlapping drawer on the right with **Input** and **Output** tabs (**Input** is the default); the active tab’s text is previewed as Markdown (`AiVerdictMarkdown`); a **Copy** icon copies the raw stored text for the active tab (not the rendered preview) and toasts success or failure. Clicking outside a drawer (or its Close control) collapses the topmost drawer; closing the history drawer also closes the detail drawer.
* **Dialogs** — View-only dialogs (detail/read-only, delete confirms) close when the user clicks the outer backdrop. Add/Edit form dialogs do not close on backdrop click; the user must use Close (X) or the main action (Apply/Save).
* **Feedback** — Every user action that results in an API call must notify the user of the result. Always use a **toast** for that notice.
* **Action icons** — **Add** is a plus icon; **Edit** is a pencil icon; **Delete** is a red trash icon; **View** is an eye icon; **Close** is an X (cross) icon (accessible labels required when icon-only).
* **Dialog close** — Every dialog (including confirm dialogs) has a Close (X) control in the **top-right corner**. Close is not placed beside the dialog’s main action (Apply, Delete, and similar).

## Phases

Phases are listed below as they are defined. Only the current/next Phase is fully specified; later Phases are added when ready.

* [x] **Phase 1 — Technology stack** — Propose a technology stack that satisfies the requirements above and obtain the developer's approval before beginning implementation.
  * **Outcome (2026-09-04):** Stack approved. Technical details recorded in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-1-technology-stack.md`](./plans/2026-09-04-phase-1-technology-stack.md).
* [x] **Phase 2 — Backend foundation** — Establish a standalone local API server that supports multi-user email login and persists data without paid external services. Frontend is deferred; this phase delivers a runnable API + database only.
  * **Outcome (2026-09-04):** Standalone API running locally. Stack revised in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-2-backend-foundation.md`](./plans/2026-09-04-phase-2-backend-foundation.md).
* [x] **Phase 3 — Frontend architecture** — Establish the local web UI structure so users can register, log in, and reach an authenticated app shell. Feature screens (JD, resume, API keys) are deferred.
  * **Outcome (2026-09-04):** Web UI at `apps/web` with auth shell and API proxy. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-3-frontend-architecture.md`](./plans/2026-09-04-phase-3-frontend-architecture.md).
* [x] **Phase 4 — Studio web shell** — Give the authenticated UI a studio layout: top bar with project title and user menu, left navigation for Workspace and Settings, and a dark-default theme that can switch to light. Feature workflows (JD, resume, API keys) remain deferred; pages are structural shells.
  * **Outcome (2026-09-04):** Studio shell with JoHEL header, sidebar, and theme toggle. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-4-studio-web-shell.md`](./plans/2026-09-04-phase-4-studio-web-shell.md).
* [x] **Phase 5 — AI Agent settings** — Let each signed-in user save an AI provider and API key from Settings. The Theme section stays. The stored key is never shown in full (masked first/last four characters). Only Cursor is available in this phase.
  * **Outcome (2026-09-04):** Settings persist a per-user Cursor API key (masked on display). Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-5-ai-agent-settings.md`](./plans/2026-09-04-phase-5-ai-agent-settings.md).
* [x] **Phase 6 — Workspace workflows** — Workspace has always-open submenus **Workflows** and **Generate**. Workflows is a per-user list (name, optional description, used count, dates) with keyword filter, pagination, add, edit, and delete.
  * **Outcome (2026-09-04):** Workflows list and Generate placeholder. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-6-workspace-workflows.md`](./plans/2026-09-04-phase-6-workspace-workflows.md).
* [x] **Phase 7 — Workflow editor** — Creating or editing a workflow uses a dedicated page (not a dialog). The form includes name, optional description, language, verdict prompt, and a metadata key/rule table. Save persists via the API.
  * **Outcome (2026-09-04):** Dedicated `/workflows/new` and `/workflows/[id]/edit` pages with shared form. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-7-workflow-editor.md`](./plans/2026-09-04-phase-7-workflow-editor.md).
* [x] **Phase 8 — Workspace profiles** — Workspace includes **Profiles** (above Workflows). Per-user profiles list with search, pagination, add, edit, and delete. Add/edit use dedicated pages; Links work like workflow Metadata (local until Save).
  * **Outcome (2026-09-04):** Profiles list and editor with `profiles` / `profileLinks`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-8-workspace-profiles.md`](./plans/2026-09-04-phase-8-workspace-profiles.md).
* [x] **Phase 9 — Workspace companies** — Workspace includes **Companies** (between Profiles and Workflows) and **Experiences** (after Companies). Companies is a per-user list with search, pagination, add, edit, and delete. Add/edit use dedicated pages; Metadata works like workflow Metadata (local until Save). Experiences is a placeholder submenu.
  * **Outcome (2026-09-04):** Companies list and editor with `companies` / `companyMetadata`; Experiences placeholder. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-9-workspace-companies.md`](./plans/2026-09-04-phase-9-workspace-companies.md).
* [x] **Phase 10 — Workspace experiences** — Workspace **Experiences** is a per-user list with search, pagination, add, edit, and delete. Add/edit use dedicated pages; Metadata works like company Metadata (local until Save).
  * **Outcome (2026-09-04):** Experiences list and editor with `experiences` / `experienceMetadata`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-10-workspace-experiences.md`](./plans/2026-09-04-phase-10-workspace-experiences.md).
* [x] **Phase 11 — Generate UI (Job step)** — Generate gates on Profile/Company/Experience/Workflow; timeline Job → PCEW → Verdict → Company → Generate; Job step with URL/File/Manual, Noise Filter, AI Filter stub, rollback; Choose PCEW dialog; header Token Used (K/M/G/T). UI only.
  * **Outcome (2026-09-04):** Generate Job UI and prerequisites alert. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-11-generate-ui.md`](./plans/2026-09-04-phase-11-generate-ui.md).
* [x] **Phase 12 — Noise Filter** — Extensible deterministic Noise Filter pipeline (normalize → HTML → Markdown → boilerplate → duplicate → navigation → section) plus default plugins **WalletAddress** and **DeJob**. Preserve job/company information; expose reduction diagnostics; unit tests with Vitest. AI Filter remains a stub.
  * **Outcome (2026-09-04):** Pipeline under `apps/web/src/lib/noise-filter/` including WalletAddress and DeJob plugins. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-12-noise-filter.md`](./plans/2026-09-04-phase-12-noise-filter.md).
* [x] **Phase 13 — AI Filter** — AI Filter calls the configured AI Agent Provider with a provider-specific system prompt; extracts Job and Job post Company & contacts as Markdown; persists token usage in `aiUsage`; result dialog (Discard / Retry / Next, no backdrop dismiss); fullscreen loading; header Token Used aggregates usage.
  * **Outcome (2026-09-04):** Cursor provider adapter, `POST /ai-filter`, `GET /ai-usage/summary`, Markdown result dialog. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-13-ai-filter.md`](./plans/2026-09-04-phase-13-ai-filter.md).
* [x] **Phase 14 — Generate PCEW step** — PCEW timeline step with Profile (single select), Companies (multi), Experiences (multi), and Workflow (single) tables; row click for selection; View (eye icon) for read-only detail dialogs; Prev / Next with inline validation; AI Filter **Next** advances to PCEW.
  * **Outcome (2026-09-04):** `GeneratePcewStep`, shared `PcewSection` / `ViewButton`; session selection in page state. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-14-generate-pcew.md`](./plans/2026-09-04-phase-14-generate-pcew.md).
* [x] **Phase 15 — Generate session persistence** — Remember in-progress Generate run (timeline step, Job state, PCEW selection) across refresh and navigation via per-user `sessionStorage` until the run finishes or is cleared; fix double vertical scrollbar on PCEW.
  * **Outcome (2026-09-04):** `generate-session.ts`, `useGenerateSession`; PCEW table wrappers use horizontal-only overflow. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-15-generate-session-persistence.md`](./plans/2026-09-04-phase-15-generate-session-persistence.md).
* [x] **Phase 16 — Generate Verdict step** — Verdict timeline step runs the configured AI Agent with a simple system prompt and an editable session-only Verdict Prompt (initialized from workflow; never writes back); Run / Retry; Prev / Next; persist result and tokens.
  * **Outcome (2026-09-04):** `POST /verdict`, `ai-verdict` adapters, `GenerateVerdictStep`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-16-generate-verdict.md`](./plans/2026-09-04-phase-16-generate-verdict.md).
* [x] **Phase 17 — Generate three steps** — Collapse Generate timeline to Job → PCEW → Generate; remove Verdict and Company steps, the verdict runner, and workflow Verdict Prompt (editor, API, database).
  * **Outcome (2026-09-04):** Three-step timeline; verdict code and `workflows.verdictPrompt` removed. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-17-generate-three-steps.md`](./plans/2026-09-04-phase-17-generate-three-steps.md).
* [x] **Phase 18 — Workspace Verdict** — Workspace **Verdict** submenu between Workflows and Generate; `/verdict` page with one required Verdict Prompt textarea; one prompt per user persisted in `verdicts`.
  * **Outcome (2026-09-04):** `GET` / `PUT /verdict`, `/verdict` page, sidebar link. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-18-workspace-verdict.md`](./plans/2026-09-04-phase-18-workspace-verdict.md).
* [x] **Phase 19 — Generate Job step pipeline** — Job step **Next** only; silent noise filter + `POST /ai-verdict` (renamed from ai-filter) with Verdict Prompt; advance to PCEW; Markdown result at top of PCEW.
  * **Outcome (2026-09-04):** `ai-verdict` stack, Job **Next** pipeline, PCEW result panel, Verdict prerequisite. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-19-generate-job-next-pipeline.md`](./plans/2026-09-04-phase-19-generate-job-next-pipeline.md).
* [x] **Phase 20 — Generate resume step** — PCEW **Next** runs `POST /ai-resume`; store canonical `GeneratedResume` JSON in session; Generate step renders Markdown from JSON and downloads DOCX from JSON.
  * **Outcome (2026-09-04):** `@johel/resume` package, `ai-resume` API, `GenerateGenerateStep`, session resume persistence, DOCX download. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-20-generate-resume.md`](./plans/2026-09-04-phase-20-generate-resume.md).
* [x] **Phase 21 — Add OpenAI provider** — Settings lets each user choose **Cursor AI Agent** or **OpenAI** and save one API key; Generate Job and PCEW resume generation use the saved provider.
  * **Outcome (2026-09-05):** OpenAI Responses adapters (`gpt-5.6-luna` for AI Verdict, `gpt-5.6-terra` for AI Resume); Settings provider dropdown enabled. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-21-openai-provider.md`](./plans/2026-09-05-phase-21-openai-provider.md).
* [x] **Phase 22 — Redefine workflows as PCEW presets** — Workflows bundle one profile, one or more companies, and one or more experiences plus resume output language. Remove workflow metadata. Workflow editor includes PCEW-style pickers. Generate middle step is **Workflow** (workflow-only selection). Prerequisites require Workflow and Verdict only.
  * **Outcome (2026-09-05):** Workflows store PCEW selections; `workflowMetadata` removed; Generate timeline Job → Workflow → Generate. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-22-redefine-workflows.md`](./plans/2026-09-05-phase-22-redefine-workflows.md).
* [x] **Phase 23 — Refine sidebar and Prompts** — Rename Verdict to **Prompts** (`/prompts`) with Verdict Prompt and Generate Prompt. Sidebar sections **Workspace** and **Run** (Generate under Run); section labels use normal title case.
  * **Outcome (2026-09-05):** `/prompts` page and API; `generatePrompt` on `verdicts`; Generate prerequisite checks both prompts. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-23-sidebar-prompts.md`](./plans/2026-09-05-phase-23-sidebar-prompts.md).
* [x] **Phase 24 — Generate sticky header and side navigation** — Sticky page title and timeline; large round chevron (and download on the last step) controls in side gutters alongside step content.
  * **Outcome (2026-09-05):** Sticky title + `GenerateTimeline`; `GenerateStepNav` three-column layout with sticky vertically centered side buttons. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-24-generate-side-nav.md`](./plans/2026-09-05-phase-24-generate-side-nav.md).
* [x] **Phase 25 — Generate Evaluate step** — Add **Evaluate** as the final timeline step; **Generate** **Next** runs AI evaluation and advances; **Download** moves to **Evaluate**; evaluation result shown as Markdown.
  * **Outcome (2026-09-05):** `POST /ai-evaluate`, `GenerateEvaluateStep`, session evaluation persistence, Generate step keeps Next. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-25-generate-evaluate.md`](./plans/2026-09-05-phase-25-generate-evaluate.md).
* [x] **Phase 26 — Generation flow processing** — Settings **Process** section with **Do Verdict** and **Do Evaluate** checkboxes; Generate skips optional AI steps and hides **Evaluate** when disabled.
  * **Outcome (2026-09-05):** `generationProcess` table, `GET/PUT /settings/process`, dynamic timeline, conditional prompt prerequisites. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-26-generation-process.md`](./plans/2026-09-05-phase-26-generation-process.md).
* [x] **Phase 27 — Generate process session handling** — One Generate process runs Job through DOCX download; going back then forward reuses cached AI results when inputs are unchanged; **New** resets to a blank Job step; saving changed **Do Verdict** or **Do Evaluate** in Settings resets Generate; DOCX downloads use a date-prefixed filename including workflow name.
  * **Outcome (2026-09-05):** Verdict result caching, **New** header control, settings-driven session reset, `YYYY-MM-DD-{name}-{workflow}.docx` naming. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-27-generate-process-session.md`](./plans/2026-09-05-phase-27-generate-process-session.md).
* [x] **Phase 28 — Invalidate Generate cache on PCE changes** — When Profile, Companies, Experiences, or workflow composition linked to the selected workflow change, Workflow **Next** regenerates the resume and Generate **Next** re-evaluates; unchanged PCE still reuses cached AI results.
  * **Outcome (2026-09-05):** `GET /workflows/:id/generation-fingerprint`, workflow content fingerprint in `generationInputKey`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-28-pce-cache-invalidation.md`](./plans/2026-09-05-phase-28-pce-cache-invalidation.md).
* [x] **Phase 29 — Prompt Optimization** — Before AI Verdict, Generate, and Evaluate run, compile each saved user prompt deterministically and optionally rewrite it with AI (cached by prompt hash). Settings **Prompt Optimization** section with **Use prompt optimization using AI** (default on). Saved prompts on the Prompts page are unchanged; codebase const system prompts are unchanged. Generate cache keys include prompt hashes and the optimization flag; saving a changed optimization flag resets Generate.
  * **Outcome (2026-09-05):** `prompt-optimize` module, `promptOptimizations` table, `GET/PUT /settings/prompt-optimization`, Settings Prompt Optimization section. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-05-phase-29-prompt-optimization.md`](./plans/2026-09-05-phase-29-prompt-optimization.md).
* [x] **Phase 30 — Remove Metadatas** — Remove company and experience metadata (database, API, UI). Remove the **Used** field from the workflow detail dialog.
  * **Outcome (2026-09-06):** `companyMetadata` and `experienceMetadata` tables dropped; company/experience editors and lists simplified; workflow detail no longer shows Used. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-30-remove-metadatas.md`](./plans/2026-09-06-phase-30-remove-metadatas.md).
* [x] **Phase 31 — Remove company priority** — Remove the Priority field from companies (database, API, UI, and resume generation input).
  * **Outcome (2026-09-06):** `companies.priority` column dropped; company list ordered by name; editors and detail dialogs simplified. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-31-remove-company-priority.md`](./plans/2026-09-06-phase-31-remove-company-priority.md).
* [x] **Phase 32 — AI Usage History drawer** — Fixed bottom-right history button opens a right-side usage table drawer (100 rows per page); row click opens a nested drawer with input and output text; backdrop dismiss closes the topmost drawer.
  * **Outcome (2026-09-06):** `GET /ai-usage` list and `GET /ai-usage/:id` detail; global FAB and nested drawers on the authenticated shell. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-32-ai-usage-history.md`](./plans/2026-09-06-phase-32-ai-usage-history.md).
* [x] **Phase 33 — Docker Environment** — One Docker image contains API and web together. Run on **Docker Desktop** (Apple Silicon); publish port **4041** so other LAN devices can use the app. Database persists on the host that runs the container when the image is updated.
  * **Outcome (2026-09-06):** `Dockerfile`, `docker-compose.yml`, and [`docs/docker.md`](./docker.md) (Case A: local Desktop; Case B: other device Desktop). Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-33-docker-environment.md`](./plans/2026-09-06-phase-33-docker-environment.md).
* [x] **Phase 34 — User Prompt Helper with AI** — On Prompts, each prompt field has an Add control that opens a dialog (max 1,000 characters); **Create** calls AI to append one concise sentence under `## New`; page Save still persists.
  * **Outcome (2026-09-06):** `POST /ai-prompt-helper`, `PromptHelperDialog`, plus buttons on `/prompts`, `promptHelper` usage type. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-34-prompt-helper.md`](./plans/2026-09-06-phase-34-prompt-helper.md).
* [x] **Phase 35 — Workflow company–experience mapping** — Workflow editor adds company entries one at a time via a dialog (company, required period, linked experiences); company order is résumé order; résumé generation uses explicit company→experience mapping.
  * **Outcome (2026-09-07):** `workflowCompanyExperiences` junction; required `startDate`/`endDate` on workflow company entries; nested workflow API payload; `WorkflowCompaniesEditor` UI. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-35-workflow-company-experiences.md`](./plans/2026-09-07-phase-35-workflow-company-experiences.md).
* [x] **Phase 36 — Remove Prompt Optimization, add AI Workflow Recommendation** — Remove Settings Prompt Optimization and the optional AI prompt rewrite path. Add **Do Workflow Recommendation** and **Recommendation threshold** to Settings Process. After Job **Next**, optionally auto-select the best-matching workflow (score ≥ threshold) or restore the last manually selected workflow when recommendation is off.
  * **Outcome (2026-09-07):** Dropped `promptOptimizations` and `usePromptOptimizationAi`; `POST /ai-workflow-recommend`; Process settings extended; Generate Job→Workflow recommendation/restore with session cache. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-36-workflow-recommendation.md`](./plans/2026-09-07-phase-36-workflow-recommendation.md).
* [x] **Phase 37 — One-time Prompt on Workflow step** — Optional **One-time Prompt** textarea on Generate **Workflow**; when filled, appended to the Generate Prompt for that run’s resume generation only; session-scoped (not saved on Prompts page).
  * **Outcome (2026-09-07):** `oneTimePrompt` in Generate session; Workflow step UI; `POST /ai-resume` optional body field; cache key includes one-time text. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-37-one-time-prompt.md`](./plans/2026-09-07-phase-37-one-time-prompt.md).
* [x] **Phase 38 — Auto markdown format on save** — On **Save**, convert Verdict / Generate / Evaluate prompts and Company / Experience descriptions to markdown via the user's AI Agent; skip conversion when the field is unchanged since last save; show a notice that contents are auto-converted; fullscreen loading when conversion runs; detail dialogs render descriptions as Markdown.
  * **Outcome (2026-09-07):** `ai-markdown-format` module, `formatMarkdownOnSave` on write routes, `markdownFormat` usage type, web hints and `BusyOverlay`, markdown in detail dialogs. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-38-auto-markdown-format.md`](./plans/2026-09-07-phase-38-auto-markdown-format.md).
* [x] **Phase 39 — Remove Prompt Helper** — Remove the Phase 34 one-sentence Add feature (API, UI Add buttons, helper dialog, client helpers). Prompts **Edit** preview + page **Save** and auto-markdown-on-save remain unchanged.
  * **Outcome (2026-09-07):** Removed `POST /ai-prompt-helper`, `PromptHelperDialog`, Add buttons on `/prompts` and company/experience editors, and `promptHelper` from active `generateType` values; historical `promptHelper` usage rows still display in AI Usage History. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-39-remove-prompt-helper.md`](./plans/2026-09-07-phase-39-remove-prompt-helper.md).
* [x] **Phase 40 — User-owned prompt pipeline** — User-defined Verdict / Generate / Evaluate structure; `# Instructions` compile with strong separator; prompt markdown capped at `##` on save; default templates on sign-up; Philosophy documented (JoHEL does not guarantee output quality).
  * **Outcome (2026-09-07):** `@johel/prompt-defaults`, unified compile + execution rules, heading cap in `ai-markdown-format`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-40-user-owned-prompt-pipeline.md`](./plans/2026-09-07-phase-40-user-owned-prompt-pipeline.md).
* [x] **Phase 41 — Copyable text & dialog rule** — Copy icon on AI Usage Detail Input/Output; view-only dialogs dismiss on backdrop click; add/edit form dialogs do not.
  * **Outcome (2026-09-07):** `CopyButton`, `copyTextToClipboard`, `DetailDialog` `mode="view"|"form"`, `WorkflowCompanyDialog` on `DetailDialog`; AI Usage Detail uses Input/Output tabs with Markdown preview and raw-text copy. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-41-copyable-text-dialog-rule.md`](./plans/2026-09-07-phase-41-copyable-text-dialog-rule.md).
* [x] **Phase 42 — Descriptions as resume prompts** — Company, Experience, and Workflow description fields are required; editors explain that descriptions are used as prompts during resume generation.
  * **Outcome (2026-09-07):** `DESCRIPTION_AS_RESUME_PROMPT_HINT`, workflow description required in API/schema. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-42-descriptions-as-prompt.md`](./plans/2026-09-07-phase-42-descriptions-as-prompt.md).
* [x] **Phase 43 — Prompts tabbed save** — Split Workspace Prompts into Verdict / Generate / Evaluate tabs; each tab saves its prompt independently.
  * **Outcome (2026-09-07):** `PUT /prompts/verdict`, `PUT /prompts/generate`, `PUT /prompts/evaluate`; tabbed `/prompts?tab=` UI with per-tab Save. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-07-phase-43-prompts-tabbed-save.md`](./plans/2026-09-07-phase-43-prompts-tabbed-save.md).
* [x] **Phase 44 — Company structure** — Replace the single company description with structured fields: alias (required, first field), company name (required), what this company is (required; one-sentence industry/product/customer context), and domain & stack (required; bullet-style scope, tech, regulation/scale). Editor shows English guidelines, good/bad examples, and guidance that personal achievements belong in shared experiences, not company descriptions. List, detail, search, and resume generation use the new fields; existing companies are migrated (alias from name, what this company is from old description; domain & stack must be filled on next edit).
  * **Outcome (2026-09-08):** `companies` schema with `alias`, `whatCompanyIs`, `domainAndStack`; updated Companies API, form, list, detail, workflow picker, and resume assembly input. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-44-company-structure-update.md`](./plans/2026-09-08-phase-44-company-structure-update.md).
* [x] **Phase 45 — Experience structure** — Replace the single experience description with structured fields: category (required), problem (required), actions (required), and outcome (optional). Editor shows English guidelines and shared guidance that one card should represent one capability unit for better synthesis. List, detail, search, workflow picker, and resume generation use the new fields; existing experiences are migrated (problem from old description; actions must be filled on next edit).
  * **Outcome (2026-09-08):** `experiences` schema with `problem`, `actions`, `outcome`; updated Experiences API, form, list, detail, workflow picker, and resume assembly input. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-45-experience-structure-update.md`](./plans/2026-09-08-phase-45-experience-structure-update.md).
* [x] **Phase 46 — Resume section order and prompt seeds** — Preview and DOCX use Summary → Experience → Skills → Education (then optional Certifications and Projects). Sign-up prompt seeds match the Verdict heading contract used for resume generation.
  * **Outcome (2026-09-08):** Markdown and default DOCX template section order aligned; `@johel/prompt-defaults` Verdict/Generate templates updated. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-46-resume-section-order.md`](./plans/2026-09-08-phase-46-resume-section-order.md).

## Cursor Rules (Documentation Governance)

These rules apply to **all development phases** and must be followed by Cursor (and any AI agent) working on this project.

1. **Satisfy this documentation** — Every phase of work (requirements, review, development, testing, and any later phase) must satisfy the requirements and constraints defined in this document (`docs/specification.md`).
2. **Single source of product specification** — All product updates, requirement changes, and new specifications must be recorded in this document. Do not leave specification-level decisions only in chat, commits, or code comments.
3. **No detailed technical handling here** — This document describes *what* the product must do and *why*. It must **not** include detailed technical implementation (APIs, schemas, library choices, algorithms, infra steps, etc.).
4. **Technical details live in `technology.md`** — Crucial and important technical handling must be stored in `docs/technology.md`, not in this specification document.
5. **Define Phases one by one** — Define each Phase and its content only when starting that Phase. Do not invent a full multi-phase roadmap in advance.
6. **Mark finished Phases** — When a Phase is performed and finished, check it as finished in this document (e.g. change `[ ]` to `[x]`).
7. **Grow documentation with Phases** — As Phases complete, expand this document (and `docs/technology.md` for technical handling) with the outcomes and any new specifications that resulted from that Phase.
8. **Archive built Cursor plans** — Once a Cursor plan is built (approved / executed for a phase), store a copy under `docs/plans/`. Prefix the filename with the performed date as `YYYY-MM-DD`, then a short slug (e.g. `docs/plans/2026-09-04-phase-1-technology-stack.md`).
9. **Toast for API results** — Every user action that triggers an API call must notify the user of the result, and that notice must always be a toast.
10. **Form validation UX** — Form action buttons (Save, Add, Apply, Submit, and similar) stay enabled. Required field labels show a red asterisk. Missing required fields show an error message below the field when the user attempts the action (not via disabling the button; not via toast for ordinary required-field checks).
11. **Frontend component size** — If a frontend component file exceeds 500 lines, ask the user whether to optimize or split it before adding substantial new code.
12. **Action button icons** — **Add** uses a plus icon; **Edit** uses a pencil icon; **Delete** uses a trash icon in red; **View** uses an eye icon; **Close** uses an X (cross) icon. Icon-only controls need an accessible label.
13. **Dialog close placement** — Every dialog has a Close (X) button in the top-right corner. Do not put Close beside the dialog’s main action.

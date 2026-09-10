# Project: Customized Resume / CV and Resume Builder

## Purpose

**JoHEL** is a customized Resume / CV and resume writing application. It helps a user combine personal profile data, companies, and shared hands-on experience to process a Job Description and generate a tailored resume for each run.

## Philosophy

**JoHEL does not guarantee or take responsibility for output quality.**

Result quality depends entirely on the user's prompt authoring and the capabilities of the AI provider they configure. JoHEL provides tooling to compose, store, compile, and run prompts—it does not warrant the suitability, accuracy, completeness, or effectiveness of AI-generated outputs. Users are free to define their own prompt structure and instructions; what the AI produces is between the user and their chosen model.

## Product concept

### What the user owns

* **Profiles** — One user can manage **multiple profiles** (personal identity variants used when generating).
* **Companies** — One user can manage **multiple companies** (display priority, alias, name, what this company is, and domain & stack — all required; used as resume-generation prompts).
* **Shared Experiences** — One user can add and update their working / hands-on experiences as a **shared** pool used across generations (not tied to a single profile alone). Each experience has a required category, required problem, required actions, and required outcome used as resume-generation prompts. One card is one capability unit. Stack-only variants of the same capability (for example NestJS vs Go) are allowed; the author must not link more than one variant of that capability to the same company in the same generation run. **Add/Edit** uses fact input → AI advisor → preview → Apply (not manual STAR forms as the default path).
* **Prompts** — Per-user **Verdict Prompt**, **Generate Prompt**, and **Evaluate Prompt**, used when checking Job Descriptions, generating resumes, and evaluating resumes. New accounts receive default prompt templates on sign-up; non-admin users may add **extensions** appended to the compiled system prompt; admins may edit full prompts. Output structure and instructions are user-defined within those rules; JoHEL does not guarantee AI output quality (see **Philosophy**).

### End-to-end flow

A generation run combines:

**Job Description** → **Filtering** → **Verdict** (optional) → **Combine** (per-run profile, companies, experiences, emphasis) → **Generate** → **Evaluate** (optional)

```text
Job Description → Filtering → Verdict? → Combine → Generate → Evaluate?
```

1. **Job Description** — Provide the JD (URL, file, or manual input) and filter it.
2. **Verdict** (when **Do Verdict** is on) — Run AI Verdict on the filtered JD; the Markdown result is the scoring rubric for generation and evaluation.
3. **Combine** — For this run only: choose one profile, optional **Run guidance** (emphasis), included companies via a card grid (include toggle, dual-thumb period slider over a 10-year window, inline role context, optional **Keyword context** per company), and link shared experiences via **Add Experiences** → **Suggest experiences** (when Keyword context is filled, AI maps experiences for that company using keywords plus job/Verdict and role context; when empty, that company uses Auto from job/Verdict and role context only). After **Suggest experiences**, suggestions apply immediately and show the selected profile, each included company (name, period, role context, keyword context), suggested cards, rationale, and warnings; **Suggest experiences** is replaced by **Suggest Again**; guidance tells the user to click **Run** on the step bar. Step-bar **Run** stays disabled until profile, companies, required fields, and at least one linked experience are ready.
4. **Generate** — Generate the resume from the job context and the Combine snapshot.
5. **Evaluate** (when **Do Evaluate** is on) — Score the generated resume against the same Verdict dimensions, then download the resume.

### Workspace authoring

Company and Experience fields are resume-generation prompts. Generation multiplies **company scene × linked capability cards × job rubric**.

* **Company** holds scene only (industry, product, customer, domain, stack, snapshot scale). Personal achievements and before→after metrics do not belong here.
* **Experience** holds one capability (STAR). Category names the capability (stack suffix only when keeping intentional variants). Outcome numbers stay on the card that produced them. Do not store routing instructions (“use when the JD asks for X”) in Actions. Shared STAR fields must not name employers; employer context lives on the Combine company entry.
* **Combine** (per-generation snapshot, not a workspace preset) chooses profile, resume company order, which cards attach to which company, and optional run emphasis. The browser remembers the last **profile** and included **companies** (period, role context, keyword context) per signed-in user and pre-fills a **new generation**; **Run guidance** and AI-linked experiences do not carry over. Each included company may have optional **Keyword context** (comma-separated steering text for experience selection); empty Keyword context means that company uses Auto (job/Verdict and role context only). **Run guidance** (`emphasis`) is separate from Keyword context and applies at Generate only. Linking uses **Suggest experiences**. Resume output language is configured in Settings **Generation**, not on the Combine step. Linking a card to a company asserts that work happened there.
* **Prompts** (Verdict / Generate / Evaluate) say how to read the JD and write/score the resume. They do not add facts. Run-specific tailoring uses Combine **Run guidance** (`emphasis` on the Combine snapshot).

Authoring criteria, good/bad examples, stack-variant rules, and the mapping to user-defined prompts: [`docs/workspace-authoring.md`](./workspace-authoring.md).

## Deployment

* Local deployment (development: `pnpm dev:api` + `pnpm dev:web`)
* **Docker Desktop** — one combined image (API + web). Port **4444** is published so other devices on the LAN can use the app. The container may run on **this machine** or **another machine** on the LAN; the **database stays on whichever machine runs the container** when the image is replaced. See [`docs/docker.md`](./docker.md).

## Requirements

* The project is **not intended for monetization**.
* Users should be able to configure the templates and formats used by the main features using natural language.
* The project must **not incur any additional costs from external services** during operation.

## Main Features

* Users manage **multiple profiles**, **companies**, and **shared experiences**.
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
3. Allow the user to review the AI Verdict result on the **Verdict** step (when **Do Verdict** is on).
4. Generate a Resume based on:

   * The **Combine** snapshot for this run (profile, ordered company entries with period, role context, and linked experiences, plus optional emphasis)
   * **Job context for tailoring:** when **Do Verdict** is enabled, the accepted **AI Verdict** Markdown (replacing the raw job description); when **Do Verdict** is disabled, the noise-filtered job description from the Job step. Verdict Prompt sections and extracted fields directly affect what the generator sees and thus resume quality.
   * The user’s saved **Resume Language** from Settings **Generation**
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
  * Left: hamburger control (opens / collapses the left sidebar) beside project title **JoHEL**
  * Right: **Token Used** (compact K / M / G / T, e.g. `0.3K`, `12.5K`, `0.6M`) beside the user login-ID dropdown containing **Account** and **Sign out**
* **Left sidebar** menus:
  * The sidebar starts **open**; the hamburger toggles it open or collapsed with a slide animation (same velocity easing as drawers). The last choice is remembered for the browser. Icon-only hamburger uses `aria-label` **Collapse sidebar** or **Open sidebar**.
  * **Workspace** (always-open submenus)
    * Profiles
    * Companies
    * Experiences
  * **Run** (always-open submenus)
    * Generate (`/` is Generate)
    * History (`/history`)
  * **Settings** (always-open submenus)
    * Environment
    * Prompts
* **Profiles**
  * One signed-in user can manage **multiple** profiles
  * Per-user list: No, Full Name (first + last), birth date, email, PN, links, residence, education summary (university, graduation year, degree)
  * Keyword filter on name parts, email, PN, residence, university, degree; 10 rows per page
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole profile
  * Links add/edit/delete is local on the page until Save persists the profile (same pattern as workflow Metadata)
  * Editor fields: first name (required), last name (required), birth date, email, PN, residence, university (optional), graduation year (required), graduation month (required, 1–12), degree (optional); links table (Key required; Value/link optional)
  * Distinct from header menu **Account** (`/account`)
* **Companies**
  * One signed-in user can manage **multiple** companies
  * Per-user list: No, **Display Priority**, Alias, Company Name, What this company is (truncated), Domain & Stack (truncated)
  * Keyword filter on alias, name, what this company is, and domain & stack; 10 rows per page
  * List is ordered by **Display Priority** (1-based; lower numbers first), then Company Name
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole company
  * Editor fields in order: **display priority** (required; 1-based integer), alias (required), company name (required), what this company is (required; used as a resume-generation prompt), domain & stack (required; used as a resume-generation prompt)
  * What this company is shows guideline *(One sentence: industry, product, customer)* with good and bad examples; domain & stack shows guideline for bullet lists with bold labels and indented bodies, with good and bad examples; shared note that personal achievements belong in shared experiences because the same experience can link to multiple companies
  * What this company is and domain & stack show a notice that they are used as prompts during resume generation and that contents will be automatically converted to markdown format on **Save**; when a field changed since last save, **Save** runs AI markdown conversion (requires a configured AI Agent) before persisting; unchanged fields skip conversion; domain & stack conversion formats each item as a bullet with a bold label and indented body (no document titles); fullscreen loading while conversion runs; the detail dialog renders both fields as Markdown
  * Required editor fields show a red asterisk; Save stays available; empty required fields show an error under the input
* **Shared Experiences**
  * One signed-in user maintains a **shared** set of working / hands-on experiences used across generations with any profile and company combination in Combine
  * Per-user list: No, Category, Problem, Actions, Outcome
  * Keyword filter on category, problem, actions, and outcome; 10 rows per page
  * List is ordered by Category name
  * List rows show hover; clicking a row opens a read-only detail dialog (Edit/Delete icons still work separately)
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * **Add/Edit default path:** required **What did you do?** fact textarea → **Suggest** runs the Experience advisor → **Suggestion** dialog shows draft card(s) with rationale or follow-up questions → **Apply** persists (with confirmation); STAR fields are not edited directly in the main form; **Apply** does not run a second AI markdown conversion — preview WYSIWYG matches stored text after deterministic cleanup only; **Suggest** always includes a compact index for every pool card (id, category, problem summary) plus full STAR for expanded candidates (edit target, keyword-ranked matches, and recently updated cards on Add; edit target on Edit)
  * Detail view and list remain read-only STAR Markdown
  * Required labels show a red asterisk; Suggest/Apply stay enabled; empty required fields show inline errors on submit (not a toast); API results toast
* **Prompts** (`/settings/prompts`)
  * Page content is centered in a readable column
  * One signed-in user maintains a **Verdict Prompt**, a **Generate Prompt**, and an **Evaluate Prompt**; **sign-up** seeds all three from shared default templates (`@johel/prompt-defaults`)
  * Page copy explicitly states that changes to these system prompts directly affect resume generation quality
  * **Tabs** — **Verdict**, **Generate**, and **Evaluate**; each tab shows one prompt only (`?tab=verdict|generate|evaluate`; default Verdict)
  * Editor fields: each tab’s prompt (required) is shown as a read-only Markdown preview (`AiVerdictMarkdown`); empty prompts show a muted placeholder
  * **Non-admin users** see extension textareas only (appended to the compiled system prompt); **admin** users (`users.role = admin`) may edit full prompts via **Edit** and **Save**
  * Each tab shows a notice that contents will be automatically converted to markdown format on **Save**; prompt kinds (Verdict / Generate / Evaluate) are capped at `##` as the largest heading during conversion, with deterministic `#`→`##` post-processing; when a prompt changed since last save, **Save** runs AI markdown conversion (requires a configured AI Agent) before persisting; unchanged prompts skip conversion but still receive heading-cap post-processing; fullscreen loading while conversion runs; saved preview refreshes with the converted markdown
  * Each tab’s footer has **Reset to Default** (secondary, beside **Save**) and **Save**; **Reset to Default** opens a confirm dialog and, on confirm, persists the shared default template for that tab; both actions stay enabled; required labels show a red asterisk; empty prompts show inline errors on Save (not a toast)
  * Load all prompts via `GET /prompts`; save per tab via `PUT /prompts/verdict`, `PUT /prompts/generate`, or `PUT /prompts/evaluate`; toast on API success or failure
  * The Verdict Prompt is used when checking Job Descriptions; when **Do Verdict** is enabled its Markdown output replaces the raw job description as job context for resume generation and resume evaluation (Verdict structure and extracted fields affect resume quality); the Generate Prompt is used when generating resumes; the Evaluate Prompt scores the resume against the same Verdict dimensions (Role, Technical Requirements, Final Verdict, and related sections)—the Evaluate step sends the same job context as Generate (none run on this page)
* **Generate** (`/`)
  * Each run has a short readable **Generation ID** (e.g. `GEN-20260909-001`) shown under the **Generate** title; a new ID is allocated when the user starts a new run (**+ New** or first visit after prerequisites pass)
  * Before the flow starts, the page checks that the user has at least one Profile, Company, and Experience and a saved **Generate Prompt**; **Verdict Prompt** is required only when **Do Verdict** is enabled in Settings; **Evaluate Prompt** is required only when **Do Evaluate** is enabled. If any are missing, a centered alert lists what is missing with links to the matching workspace area or Prompts tab
  * When ready, a timeline shows steps: Job → **Verdict** (when **Do Verdict** is on) → **Combine** → Generate, and **Evaluate** when **Do Evaluate** is enabled; sticky header with **Previous** / **Next** (or **Download** on the last step)
  * Generate uses the **full width** of the main content area (no centered max-width cap)
  * Below the sticky header, each step body uses a **two-column layout** (equal columns on large screens; stacked on narrow viewports). The step body fills the **remaining viewport height** below the sticky header; both panel cards stretch to that height. Both columns use the same panel header chrome (title bar with `text-sm` heading, optional right-side actions, bottom border — the same style as **Noise-Filtered Job Description**).
  * **Left column:** read-only content from the **previous** timeline step — no edit forms, method tabs, or Save/Apply controls; **its own vertical scroll** when content exceeds the panel height
  * **Right column:** the **current** step (forms, auto-run AI, Markdown results, loading overlays); **its own vertical scroll** independent of the left column; scrolling one column does not scroll the other or the sticky header
  * **Job** step **swaps** those columns: left is the Job input (method tabs + manual textarea that fills the panel height); right is a **live filtered Job Description preview** (noise filter applied to the current input) with a **character count** of the filtered text in the panel header. On narrow viewports Job is above the filtered preview; on later steps previous remains above current
  * Previous-step content by current step (respecting **Do Verdict** / **Do Evaluate** flags): **Verdict** ← noise-filtered Job Description; **Combine** ← AI Verdict Markdown when Do Verdict is on, otherwise noise-filtered Job Description; **Generate** ← read-only Combine summary (profile name, language, emphasis, included company entries with dates and role context — not the Combine editors); **Evaluate** ← generated resume Markdown preview
  * **Job** **Run**: validates the Job Description (inline error if empty); runs **Noise Filter** silently; when **Do Verdict** is on, saves the snapshot, embeds the filtered JD, and compares it to prior runs before Verdict (see **JD duplicate check** below); then advances to Verdict or Combine
  * **Verdict** (when enabled): **AI Verdict** runs during Job **Run** (when inputs changed); shows result Markdown on the Verdict step; **Run** advances to Combine when complete
  * **JD duplicate check** (when **Do Verdict** is on): before Verdict, embed the noise-filtered JD and cosine-compare to other generations for this user. When similarity meets the configured threshold, stay on **Job** and show a wide confirm dialog — left panel: new JD (filtered); right panel: matched JD (filtered) plus Generation ID and finalized vs in-progress status. Header **Close (X)** postpones (keeps Job input, does not run Verdict). **Finalized match** (already downloaded): footer **Cancel** | **Continue** — **Continue** proceeds with Verdict on the new run; **Cancel** clears the Job input and abandons this JD. **Unfinished match** (started but not downloaded): footer **Cancel** | **Switch to existing** | **Continue with new JD** — **Switch to existing** clears the current Job input then resumes the matched generation (same as History **Resume**); **Continue with new JD** proceeds with Verdict; **Cancel** clears the Job input. After **Continue** (either variant), the same filtered JD does not re-open the dialog until the Job text changes. When the check cannot run (e.g. no API key), Verdict proceeds without blocking.
  * **Combine**: choose profile, optional **Run guidance**, included companies (card grid: when none are included, sorted by company **Display Priority**; once included, selected cards follow **selection order** and unselected cards follow **Display Priority**; include toggle, period slider, horizontal **Role context** (required) and **Keyword context** (optional) label + input rows per company; period labels in **Companies** and **Add Experiences** show the month range in primary text plus a muted short inclusive duration, e.g. `Jan 2025 – Present` `(1y 9m)`), and **Add Experiences** → **Suggest experiences** to link capability cards per company (Keyword context filled → keyword-guided mapping for that company; empty → Auto from job/Verdict and role context); **Suggest** shows a fullscreen wait overlay; suggestions apply immediately and display the selected profile, each included company (name, period, role context, keyword context), suggested cards, rationale, and warnings; **Suggest experiences** is hidden after the first suggestion and replaced by **Suggest Again**; guidance tells the user to click **Run** on the step bar; suggested cards in **Add Experiences** are viewable (row or **View** opens read-only experience detail); company cards do not repeat linked experiences; company selection is enabled only after a profile is selected; work period slider range is from the **profile graduation month** through the present; step-bar **Run** is disabled until profile with graduation year and month, ≥1 included company with period + role context, and at least one linked experience are ready, then advances to Generate (resume generation runs on the Generate step)
  * Session remembers step, Job, Verdict, Combine (including Run guidance), resume JSON, and evaluation until **New** or Generation settings change; **+ New** persists the current run to History (even if incomplete) and starts a fresh Generation ID with an empty Job/Verdict/resume/evaluation while **Combine** is pre-filled from the last remembered profile and company selections (period, role context, keyword context only)
  * **Generate** and **Evaluate** steps: auto-run resume generation and evaluation respectively when needed; Markdown preview; **Download** on Evaluate (or Generate when Do Evaluate is off) uses the user’s saved download format from Settings **Generation** (DOCX or PDF)
* **History** (`/history`)
  * Read-only list of saved generation runs; keyword search matches Job Description text and the Verdict / Generate / Evaluate prompts snapshotted at run start
  * Table columns: **Current** (shows a **Current** mark when the row is the active Generate session), **Generation ID**, **Token Used**, **Steps** (all timeline steps for that run’s process settings plus **Download**; completed steps highlighted; **Download** highlighted when the user downloaded the resume), **Updated At**; 10 rows per page; row click opens a wide read-only detail drawer; drawer **Resume** is always available
  * Detail drawer (from `/history` list or `?publicId=`): same timeline and two-column step layout as Generate, fully read-only (browse steps only; no edits or AI re-run); **Download** and **Resume** round icon buttons when applicable
* **Settings**
  * **Environment** (`/settings/environment`) — centered in a readable column; `/settings` redirects here
  * Theme (Dark / Light)
  * **Language** (English / Korean; English default; applies immediately and is remembered per browser)
  * **AI Agent**: provider (**Cursor AI Agent** or **OpenAI**) and the user’s **API key**
  * A saved API key is shown only in part (first and last four characters), never in full
  * **Generation** (`/settings/generation`) — centered in a readable column; sidebar between Environment and Prompts
  * **Process**: **Do Verdict** and **Do Evaluate** checkboxes (both default on)
  * **Resume Language**: default resume output language for Generate (`en`, `ja`, `zh-TW`, `zh-CN`, `ko`; default `en`); changing Process or Resume Language clears an in-progress Generate session
  * **Download**: default resume download format (**DOCX** default, **PDF**); **PDF** is available only when **Resume Language** is `en` (English-only for this release); changing download format does **not** clear an in-progress Generate session; one **Save** persists all Generation settings
  * **Prompts** — see **Prompts** above (`/settings/prompts`)
* **Account** (`/account`) — Header user-menu **Account** (distinct from Workspace **Profiles**). Shows the signed-in **Login ID**. **Reset Password** requires current password, new password, and confirm new password; Save/Reset stays enabled; inline errors on submit; toast on API result. Legacy `/profile` redirects here.
* **AI Usage History** — A fixed bottom-right round button (history / clock icon) on every authenticated page opens a right-side drawer with the user’s AI usage history. The drawer has **All**, **Generation**, and **Other** tabs. **All** lists every AI usage call without grouping, newest first. **Generation** groups calls by Generation ID (newest groups first); each group row shows the Generation ID, **AI call count**, and **sum of tokens used**; expanding a group loads that group’s call rows. **Other** lists AI usage that is not linked to a generation run, without grouping, newest first. Call rows on **All** and expanded **Generation** groups include **Generation ID** plus: No, AI, Model, Generate Type, Input Token, Output Token, Created At; **Other** call rows omit **Generation ID** (No, AI, Model, Generate Type, Input Token, Output Token, Created At). Pagination is stuck to the bottom of the drawer (100 calls per page on All/Other; 50 groups per page on Generation). Clicking a call row opens a nested overlapping drawer on the right with **Input** and **Output** tabs (**Input** is the default); the active tab’s text is previewed as Markdown (`AiVerdictMarkdown`); a **Copy** icon copies the raw stored text for the active tab (not the rendered preview) and toasts success or failure. Clicking outside a drawer (or its Close control) collapses the topmost drawer; closing the history drawer also closes the detail drawer.
* **Drawers** — Every right-side drawer slides in from the right on open and slides out on close, with velocity easing (fast start, decelerate). Drawers do not appear or disappear instantly. Nested drawers animate independently.
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
* [x] **Phase 33 — Docker Environment** — One Docker image contains API and web together. Run on **Docker Desktop** (Apple Silicon); publish port **4444** so other LAN devices can use the app. Database persists on the host that runs the container when the image is updated.
  * **Outcome (2026-09-06):** `Dockerfile`, `docker-compose.yml`, and [`docs/docker.md`](./docker.md) (Case A: local Desktop; Case B: other device Desktop). Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-33-docker-environment.md`](./plans/2026-09-06-phase-33-docker-environment.md).
* [x] **Phase 34 — User Prompt Helper with AI** — On Prompts, each prompt field has an Add control that opens a dialog (max 1,000 characters); **Create** calls AI to append one concise sentence under `## New`; page Save still persists.
  * **Outcome (2026-09-06):** `POST /ai-prompt-helper`, `PromptHelperDialog`, plus buttons on `/prompts`, `promptHelper` usage type. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-06-phase-34-prompt-helper.md`](./plans/2026-09-06-phase-34-prompt-helper.md).
* [x] **Phase 35 — Workflow company–experience mapping** — Workflow editor adds company entries one at a time via a dialog (company, required period, linked experiences); company order is resume order; resume generation uses explicit company→experience mapping.
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
* [x] **Phase 47 — Evaluate Prompt aligned with Verdict** — Default Evaluate Prompt scores the same Verdict dimensions as Generate (Role, Technical Requirements, Final Verdict, and related sections). New sign-ups receive it from `@johel/prompt-defaults`.
  * **Outcome (2026-09-08):** Evaluate seed template and execution-rule heading fallback; Prompts Evaluate tab hint. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-47-evaluate-prompt-verdict-rubric.md`](./plans/2026-09-08-phase-47-evaluate-prompt-verdict-rubric.md).
* [x] **Phase 48 — Labeled AI user messages** — Generate and Evaluate send labeled Markdown sections instead of a JSON dump. Evaluate uses the same job context as Generate (Verdict Markdown when Do Verdict is on).
  * **Outcome (2026-09-08):** Structured Generate user prompt (Job context, Workflow intent, Profile, Companies); Evaluate user prompt (Job context, Resume); Evaluate API `jobContext`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-48-labeled-user-messages.md`](./plans/2026-09-08-phase-48-labeled-user-messages.md).
* [x] **Phase 49 — Quick Experience authoring advisor** — Global plus FAB beside AI Usage History opens Quick Experience: optional workflow scope, required “What do you need?”, advisor suggestion drawer, and confirmed Apply to Company / Experience / Workflow links.
  * **Outcome (2026-09-08):** `POST /ai-author-advise`, `POST /ai-author-advise/apply`, `StudioBottomFabCluster`, `authorAdvise` usage type. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-49-quick-experience.md`](./plans/2026-09-08-phase-49-quick-experience.md).
* [x] **Phase 50 — UI Language (English / Korean)** — Settings / Environment adds a Language control (English default, Korean); choice applies immediately and is stored per browser. All JoHEL UI copy (shell, CRUD, Generate, Settings, Quick Experience, AI Usage History, login/register, toasts, validation, field guidance) follows the selected language. Workflow resume output language remains per-workflow and separate from UI locale.
  * **Outcome (2026-09-08):** `LocaleProvider`, `johel-locale` in `localStorage`, message catalogs (`messages/en.ts`, `messages/ko.ts`), bootstrap script for `document.documentElement.lang`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-50-ui-language.md`](./plans/2026-09-08-phase-50-ui-language.md).
* [x] **Phase 51 — Quick Experience experience draft guardrails** — Quick Experience advisor must not put employer names in Experience STAR drafts; `update_experience` uses delta-only AI output; the Suggestion drawer merges existing card text with AI additions before Apply (WYSIWYG, no content loss).
  * **Outcome (2026-09-08):** Advisor prompt guardrails, `mergeExperienceFieldUpdate`, UI merge in Suggestion drawer, Experience editor guidance. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-51-quick-experience-draft-guardrails.md`](./plans/2026-09-08-phase-51-quick-experience-draft-guardrails.md).
* [x] **Phase 52 — Quick Experience merge for all update placements** — Same merge-before-Apply behavior as Phase 51 for `update_company` (what this company is, domain & stack), `update_role_context`, and `update_workflow_description`; delta-only advisor output for those placements.
  * **Outcome (2026-09-08):** `buildAuthorAdviseDisplayDraft`, generalized Suggestion merge hint, advisor delta rules for company/workflow updates. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-52-quick-experience-merge-all-updates.md`](./plans/2026-09-08-phase-52-quick-experience-merge-all-updates.md).
* [x] **Phase 53 — CRUD list pagination and history back** — Profiles, Companies, Experiences, and Workflows list pages preserve page and search in the URL; add/edit Back, Cancel, and Save return via browser history when possible so the list restores the last visited page.
  * **Outcome (2026-09-08):** `useCrudListParams`, `useCrudFormNavigation`, URL `?page` / `?q` on list routes, `BackButton` history-back option. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-08-phase-53-crud-list-pagination-history.md`](./plans/2026-09-08-phase-53-crud-list-pagination-history.md).
* [x] **Phase 54 — Experience fact-input authoring** — Experiences add/edit use fact input → Experience advisor → Suggestion preview → Apply; advisor matches against the full experience pool (not workflow-linked only); multi-operation create/update responses.
  * **Outcome (2026-09-09):** `POST /ai-experience-advise`, `ExperienceFactForm`, `ExperienceSuggestionDialog`. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 55 — Remove Quick Experience** — Global Quick Experience FAB and `ai-author-advise` removed; Experience authoring uses the Experiences pages only.
  * **Outcome (2026-09-09):** History-only `StudioBottomFabCluster`. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 56 — Verdict as Generate step** — Job **Next** validates only; dedicated **Verdict** timeline step runs AI Verdict when **Do Verdict** is on.
  * **Outcome (2026-09-09):** `GenerateVerdictStep`, updated `generate-steps.ts`. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 57 — Combine step (manual)** — Workflow preset step replaced by per-run **Combine** snapshot; `POST /ai-resume` accepts `combine`; `assembleFromCombineSnapshot`.
  * **Outcome (2026-09-09):** `GenerateCombineStep`, session `combine`, `POST /resume/combine-fingerprint`. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 58 — Remove Workflows** — Workflow CRUD, DB tables, sidebar entry, and workflow recommendation removed.
  * **Outcome (2026-09-09):** Migration `20260909100000_remove_workflows`. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 59 — Combine AI assist** — `POST /ai-combine-recommend` suggests per-company experience mapping from JD + Verdict (guided or auto).
  * **Outcome (2026-09-09):** Suggest experiences on Combine step. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 60 — Prompt governance** — `users.role` (`admin` | `user`); non-admins edit prompt **extensions** only; admins edit full prompts; extensions appended at compile time.
  * **Outcome (2026-09-09):** Migration `20260909100001_user_role_prompt_extensions`, extension PUT routes, Settings Prompts UI. Plan archived at [`docs/plans/2026-09-09-architecture-refactor-phases-54-60.md`](./plans/2026-09-09-architecture-refactor-phases-54-60.md).
* [x] **Phase 61 — Combine per-company Keyword context** — Replace global Keyword guided / Auto mode on **Suggest experiences** with an optional **Keyword context** on each included company card. When Keyword context is filled, AI maps experiences for that company using keywords plus job/Verdict and role context; when empty, that company uses Auto (job/Verdict and role context only). Keyword context is not required. When keywords match but job overlap is thin, AI selects fewer cards and surfaces a warning. No global steering UX (e.g. copy-to-all). Keyword context is separate from Run guidance (`emphasis`).
  * **Outcome (2026-09-09):** `CombineCompanyEntry.keywordContext`, per-company hybrid `POST /ai-combine-recommend`, simplified `CombineExperienceSuggest`. Plan archived at [`docs/plans/2026-09-09-combine-per-company-keyword-context.md`](./plans/2026-09-09-combine-per-company-keyword-context.md).
* [x] **Phase 62 — Generation history** — Per-run **Generation ID** on Generate; persist runs to History on **+ New** and when the last step is reached; **History** list and read-only detail pages under **Run**.
  * **Outcome (2026-09-09):** `generations` table, `/generations` API, `/history` list and `/history/[publicId]` detail. Plan archived at [`docs/plans/2026-09-09-generation-history.md`](./plans/2026-09-09-generation-history.md).
* [x] **Phase 63 — Quick Add Experience** — Global plus FAB above AI Usage History opens **Quick Add Experience** in a drawer: same create flow as Add experience (facts → Experience advisor → suggestion preview → Apply), with a nested suggestion drawer. The full-page `/experiences/new` entry point remains.
  * **Outcome (2026-09-09):** `QuickAddExperience`, shared `useExperienceAdviseFlow` / `ExperienceFactFormFields` / `ExperienceSuggestionDrawer`. Plan archived at [`docs/plans/2026-09-09-quick-add-experience.md`](./plans/2026-09-09-quick-add-experience.md).
* [x] **Phase 64 — Generate Run navigation** — Generate timeline steps are freely clickable for read-only browsing. **Run** (replacing **Next**, play icon) advances to the next step and executes that step’s AI when applicable; **Previous** is removed (use the timeline to go back). Cached resume and evaluation are cleared only when the user **Run**s from an earlier step, with a confirm dialog when stored downstream results would be lost. Quick Add Experience and in-session edits do not clear evaluation until **Run**.
  * **Outcome (2026-09-09):** Timeline `onStepSelect`, `GenerateStepNavRunButton` (play icon), Run orchestrator in `page.tsx`, deferred session invalidation in `useGenerateSession`, `hasStaleDownstreamForRun` / clear helpers. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-09-generate-run-navigation.md`](./plans/2026-09-09-generate-run-navigation.md).
* [x] **Phase 65 — AI optimization: advisor Apply markdown skip** — Experience advisor **Suggest → Apply** persists STAR fields with deterministic markdown cleanup only; no AI **Markdown Format** call on Apply. Direct Experience CRUD **Save** still auto-converts changed STAR fields via AI (unchanged). Part of prompt/call optimization **Tier 1** (highest ROI before pool/RAG work).
  * **Outcome (2026-09-09):** `applyExperienceAdviseOperations` uses `finalizeExperienceFieldsOnSave` + validation only; `POST/PUT /experiences` unchanged. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-09-phase-65-advisor-apply-skip-markdown-format.md`](./plans/2026-09-09-phase-65-advisor-apply-skip-markdown-format.md).
* [x] **Phase 66 — AI optimization: edit-mode tiered experience pool** — On Experience **Edit** Suggest, the advisor prompt includes full STAR for the edit-target card only; other pool cards appear as a compact index (id, category, problem summary). **Add** / Quick Add Suggest still uses the full pool. Part of prompt optimization **Tier 2** (token reduction without embedding/RAG).
  * **Outcome (2026-09-09):** `formatExperiencePoolForAdvise` in experience-advise prompts; shared `summarizeExperienceProblem`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-09-phase-66-edit-mode-tiered-experience-pool.md`](./plans/2026-09-09-phase-66-edit-mode-tiered-experience-pool.md).
* [x] **Phase 67 — AI optimization: non-embedding prompt and infra** — Add-mode tiered pool (index for all cards + full STAR for keyword top-K and recent cards); slim workspace fingerprint; single DB load on Suggest; `experiencesById` on Suggest response; company markdown batch; direct experience CRUD deterministic finalize; advisor prompt trim.
  * **Outcome (2026-09-09):** Keyword tiered pool, `loadExperienceAdviseContext`, company batch markdown, deterministic direct experience save. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-09-phase-67-non-embedding-ai-optimization.md`](./plans/2026-09-09-phase-67-non-embedding-ai-optimization.md).
* [x] **Phase 68 — AI optimization: experience embedding retrieval** — OpenAI-only provider; `text-embedding-3-small` stored per experience; in-memory cosine top-K on Suggest with user pool-depth presets (compact / normal / thorough / full); no top-p.
  * **Outcome (2026-09-09):** `experienceEmbeddings` table, embedding upsert on save, Generation settings pool depth, Cursor provider removed. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-09-phase-68-experience-embedding-retrieval.md`](./plans/2026-09-09-phase-68-experience-embedding-retrieval.md).
* [x] **Phase 69 — Resume generation from History** — On **Run / History**, each row (except the active generation) has a **Resume** action. Confirming saves the current Generate session to History and restores the selected generation as the active session on **Generate**.
  * **Outcome (2026-09-10):** `POST /generations/:publicId/resume`, History table Resume button + confirm dialog, `resumeGenerationFromHistory`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-69-resume-generation-from-history.md`](./plans/2026-09-10-phase-69-resume-generation-from-history.md).
* [x] **Phase 70 — History detail drawer** — **Run / History** opens generation detail in a wide side drawer (not a separate page). Remove the table **Resume** action; **Resume** and **Download** stay in the drawer header. Legacy `/history/[publicId]` URLs redirect to `/history?publicId=…`.
  * **Outcome (2026-09-10):** `GenerationHistoryDrawer`, list row opens drawer via `?publicId`, header status link updated. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-70-history-detail-drawer.md`](./plans/2026-09-10-phase-70-history-detail-drawer.md).
* [x] **Phase 71 — PCE bundle (profiles, companies, experiences)** — Generate **Combine** and **Generate** steps must not duplicate profile/company/experience list fetches; one bundled endpoint supplies data for picker, cards, summary, and suggest UI.
  * **Outcome (2026-09-10):** Bundled list fetch with shared client cache. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-71-workspace-pcew-bundle.md`](./plans/2026-09-10-phase-71-workspace-pcew-bundle.md).
* [x] **Phase 72 — Rename PCEW to PCE** — Drop legacy **PCEW** (“workspace”) naming; use **PCE** (Profile, Company, Experience) for the bundle API, hooks, and Generate selection UI (`PceSection`, `pceSection` i18n).
  * **Outcome (2026-09-10):** `GET /pce`, `usePce`, `PceSection`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-72-rename-pcew-to-pce.md`](./plans/2026-09-10-phase-72-rename-pcew-to-pce.md).
* [x] **Phase 73 — Settings fetch deduplication** — Environment, Generation, and Prompts settings pages must not duplicate their load API calls (including shared layout/provider fetches and React Strict Mode remounts).
  * **Outcome (2026-09-10):** `cached-settings.ts` with `loadSettings`, `loadGenerationProcess`, `loadPrompts`, `loadMe`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-73-settings-fetch-dedup.md`](./plans/2026-09-10-phase-73-settings-fetch-dedup.md).
* [x] **Phase 74 — Workspace CRUD list fetch deduplication** — Profiles, Companies, and Experiences list pages must not duplicate their paginated list API calls on navigation (including React Strict Mode remounts).
  * **Outcome (2026-09-10):** `cached-crud-list.ts` with `loadProfileList`, `loadCompanyList`, `loadExperienceList`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-74-workspace-crud-list-dedup.md`](./plans/2026-09-10-phase-74-workspace-crud-list-dedup.md).
* [x] **Phase 75 — AI Usage History tabs** — AI Usage History drawer adds **All**, **Generation**, and **Other** tabs. All lists every call ungrouped (newest first). Generation groups by Generation ID (newest first). Other lists non-generation usage ungrouped (newest first).
  * **Outcome (2026-09-10):** Drawer tabs; `GET /ai-usage/groups` is generation-only; All/Other use `GET /ai-usage` (optional `generationId=none`). Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-75-ai-usage-history-tabs.md`](./plans/2026-09-10-phase-75-ai-usage-history-tabs.md).
* [x] **Phase 76 — Account page and reset password** — Header user-menu **Profile** is renamed **Account**; route `/profile` moves to `/account`. The Account page shows Login ID and **Reset Password** (current password, new password, confirm).
  * **Outcome (2026-09-10):** `/account` page, `/profile` redirect, `PUT /auth/password`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-76-account-reset-password.md`](./plans/2026-09-10-phase-76-account-reset-password.md).
* [x] **Phase 77 — Combine suggest ref tokens** — **Suggest experiences** must not require the AI to copy database identifiers. Each request assigns stable reference tokens to companies and experiences; the AI selects by ref; the server maps refs back to records before Apply.
  * **Outcome (2026-09-10):** E01/C01 ref prompts and response parsing in `ai-combine-recommend`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-77-combine-recommend-ref-tokens.md`](./plans/2026-09-10-phase-77-combine-recommend-ref-tokens.md).
* [x] **Phase 78 — Network traffic optimization** — Reduce Generate AI call payload and response size: **Suggest experiences** saves the generation snapshot then sends only `generationId`; the server loads job, Verdict, and Combine from `generations`. AI POST responses return business data and `tokenUsed` only; full prompt I/O remains in AI Usage History via the database.
  * **Outcome (2026-09-10):** Slim `ai-combine-recommend` request, `filteredJobText` on generation save, slim AI POST responses. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-78-network-traffic-optimization.md`](./plans/2026-09-10-phase-78-network-traffic-optimization.md).
* [x] **Phase 79 — JD duplicate check before Verdict** — When **Do Verdict** is on, Job **Run** embeds the filtered JD and compares it to prior generations before Verdict. Above-threshold matches open a two-panel confirm dialog (new vs matched JD). Finalized matches offer **Cancel** / **Continue**; unfinished matches offer **Cancel** / **Switch to existing** / **Continue with new JD**. **Cancel** clears Job input; **Switch** resumes the matched generation.
  * **Outcome (2026-09-10):** `generationJobEmbeddings` table, `POST /generations/:id/job-duplicate-check`, `GenerateJobDuplicateDialog`, cosine threshold `0.90`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-79-jd-duplicate-verdict.md`](./plans/2026-09-10-phase-79-jd-duplicate-verdict.md).
* [x] **Phase 80 — PDF download and Generation download format** — Settings **Generation** adds a **Download** option (**DOCX** default, **PDF**). Generate / Evaluate / History **Download** uses the saved format. **PDF** is English-only (disabled when **Resume Language** is not `en`). Changing download format does not clear an in-progress Generate session.
  * **Outcome (2026-09-10):** `generationProcess.downloadFormat`, `POST /resume/pdf`, `@johel/resume/pdf`, Settings **Download** radios, `useResumeDownload`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-10-phase-80-pdf-download.md`](./plans/2026-09-10-phase-80-pdf-download.md).

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

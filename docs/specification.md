# Project: Customized Resume / CV and Résumé Builder

## Purpose

Build a customized Resume / CV and résumé writing application.

## Deployment

* Local deployment

## Requirements

* The project is **not intended for monetization**.
* Users should be able to configure the templates and formats used by the main features using natural language.
* The project must **not incur any additional costs from external services** during operation.

## Main Features

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

1. Process and filter the Job Description.
2. Extract the metadata that the user is interested in.
3. Allow the user to review and confirm the filtered information and extracted metadata.
4. Extract information about the company that posted the job and present it to the user for review.
5. Generate a Resume based on:

   * Job Description
   * Company Information
6. Allow the user to review and edit the generated Resume.
7. Allow the user to download the final Resume as:

   * PDF
   * DOCX

## Key Metrics / Requirements

* Support **multiple users**.
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
  * Right: user name with a dropdown containing **Profile** and **Sign out**
* **Left sidebar** menus:
  * Workspace (always-open submenus)
    * Profiles
    * Workflows
    * Generate (`/` is Generate)
  * Settings
* **Profiles**
  * Per-user list: No, Full Name (first + last), birth date, email, PN, links, residence, education
  * Keyword filter on name parts, email, PN, residence, education; 10 rows per page
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole profile
  * Links add/edit/delete is local on the page until Save persists the profile (same pattern as workflow Metadata)
  * Editor fields: first name (required), last name (required), birth date, email, PN, residence, education (optional); links table (Key required; Value/link optional)
  * Distinct from header menu **Profile** (account email page)
* **Workflows**
  * Per-user list: name, optional one-line description, used count, created, updated
  * Keyword filter on name and description; 10 rows per page
  * Add and edit use dedicated pages (not dialogs); delete uses a confirm dialog
  * Editor pages show a back control beside the title; Cancel and Save apply to the whole workflow
  * Metadata add/edit/delete is local on the page until Save persists the workflow
  * Editor fields: name (required), description (optional), language (English default; Japanese; Chinese Taiwan; Chinese Mainland; Korean), filtering prompt (required; placeholder reflects Job Description Processing step 1 — “Process and filter the Job Description.”; Use Default fills the default prompt; Reset clears), metadata table (Key required; Rule prompt optional, max 1024)
  * Required editor fields show a red asterisk; Save stays available; empty required fields show an error under the input
* **Settings**
  * Theme (Dark / Light)
  * **AI Agent**: provider (currently **Cursor AI Agent** only) and the user’s **API key**
  * A saved API key is shown only in part (first and last four characters), never in full
* **Feedback** — Every user action that results in an API call must notify the user of the result. Always use a **toast** for that notice.
* **Action icons** — **Add** is a plus icon; **Edit** is a pencil icon; **Delete** is a red trash icon (accessible labels required when icon-only).

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
* [x] **Phase 7 — Workflow editor** — Creating or editing a workflow uses a dedicated page (not a dialog). The form includes name, optional description, language, filtering prompt, and a metadata key/rule table. Save persists via the API.
  * **Outcome (2026-09-04):** Dedicated `/workflows/new` and `/workflows/[id]/edit` pages with shared form. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-7-workflow-editor.md`](./plans/2026-09-04-phase-7-workflow-editor.md).
* [x] **Phase 8 — Workspace profiles** — Workspace includes **Profiles** (above Workflows). Per-user profiles list with search, pagination, add, edit, and delete. Add/edit use dedicated pages; Links work like workflow Metadata (local until Save).
  * **Outcome (2026-09-04):** Profiles list and editor with `profiles` / `profileLinks`. Details in [`docs/technology.md`](./technology.md). Plan archived at [`docs/plans/2026-09-04-phase-8-workspace-profiles.md`](./plans/2026-09-04-phase-8-workspace-profiles.md).

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
12. **Action button icons** — **Add** uses a plus icon; **Edit** uses a pencil icon; **Delete** uses a trash icon in red. Icon-only controls need an accessible label.

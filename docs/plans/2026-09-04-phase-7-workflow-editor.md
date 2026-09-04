# Phase 7 — Workflow Add/Edit Pages

## Phase definition (product-level)

Add to [docs/specification.md](../specification.md):

- **Phase 7 — Workflow editor** — Creating or editing a workflow uses a dedicated page (not a dialog). The form includes name, optional description, language, verdict prompt, and a metadata key/rule table. Save persists via the API.

Grow Workflows UX bullets: languages listed; verdict prompt default/reset; metadata Key + optional Rule prompt (max 1024).

## Routes (web)

- List stays at [`/workflows`](../../apps/web/src/app/(app)/workflows/page.tsx) — **Add** → `/workflows/new`; **Edit** → `/workflows/[id]/edit`
- Remove list-page Add/Edit dialogs; keep the custom Delete confirm modal
- Shared form component used by both new and edit pages (e.g. `WorkflowForm.tsx`)
- Footer **Save** (and Cancel → back to `/workflows`)
- Metadata **Add/Edit** uses a small same-page dialog (not a new route); Delete uses the existing themed confirm pattern

## Form fields

| Field | Rules |
| --- | --- |
| Name | required string |
| Description | optional textarea |
| Language | select; default **English** |
| Verdict Prompt | required textarea; placeholder `Keep only Job & Job post company information`; **Use Default** fills that text; **Reset** clears the field |
| Metadata | table: Key (required), Rule prompt (optional, max 1024); Add + Edit + Delete |

Language values (codes → labels):

- `en` — English
- `ja` — Japanese
- `zh-TW` — Chinese (Taiwan)
- `zh-CN` — Chinese (Mainland)
- `ko` — Korean

## Data model / API

Extend Prisma `Workflow` (migrate):

- `language` String (default `en`)
- `verdictPrompt` String
- `metadataJson` String — JSON array `[{ "key": string, "rulePrompt": string | null }]`

Extend write body and responses:

- `POST /workflows` / `PUT /workflows/:id` accept `{ name, description?, language, verdictPrompt, metadata }`
- `GET /workflows/:id` — full detail for the edit page (owner only)
- List `GET /workflows` stays lean (no need to return metadata/verdictPrompt in the table)

Validate: language enum; verdictPrompt min 1; metadata keys non-empty; rulePrompt max 1024; unique keys within one workflow.

Toast on Save success/error and on edit-page load failure (spec rule 9). Metadata Add/Edit/Delete are local until Save — no toast unless they later call the API.

## Docs / process

1. Spec Phase 7 + editor UX; mark `[x]` when done
2. [docs/technology.md](../technology.md): new columns, language codes, `metadataJson`, `GET /workflows/:id`
3. Archive `docs/plans/YYYY-MM-DD-phase-7-workflow-editor.md`

## Out of scope

- Running workflows / using prompts against JD
- Phase 8

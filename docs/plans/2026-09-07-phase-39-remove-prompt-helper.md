# Phase 39 — Remove Prompt Helper

## Goal

Remove the **Prompt Helper** feature that let users click **Add** (plus) on Prompts, Company Description, and Experience Description to AI-generate one sentence and append it under `## New`. Users continue editing via **Edit** (Prompts) or the description textarea (Companies/Experiences); **Save** and auto-markdown-on-save are unchanged.

## Removed

| Layer | Removed |
| --- | --- |
| API | `POST /ai-prompt-helper`, entire `apps/api/src/lib/ai-prompt-helper/` module |
| Web UI | `PromptHelperDialog.tsx`, **Add** buttons + helper state on `prompts/page.tsx`, `CompanyForm.tsx`, `ExperienceForm.tsx` |
| Client API | `PromptHelperKind`, `runAiPromptHelper`, related types in `apps/web/src/lib/api.ts` |
| Helpers | `appendPromptHelperText`, `PROMPT_HELPER_REQUEST_MAX` from `apps/web/src/lib/prompts.ts` |
| Usage recording | `promptHelper` from `AI_GENERATE_TYPES` in `record-ai-usage.ts` |

## Kept

- **Prompts** markdown preview + **Edit** pencil + `PromptEditDialog` + page **Save**
- **Markdown format on save** (Phase 38) — including folding legacy `## New` blocks in `ai-markdown-format/prompts.ts` for existing saved content
- **AI Usage History** label `promptHelper` → "Prompt Helper" in `ai-usage.ts` for **historical** rows already in SQLite (no migration)

## Out of scope

- Removing existing `## New` sections from user data
- Changing Company/Experience to markdown preview + edit dialog (Prompts-only pattern)
- Database migration of `aiUsage` rows

# Phase 34 — User Prompt Helper with AI

**Performed:** 2026-09-06  
**Status:** Finished

## Goal

On **Prompts**, add an AI helper per prompt field: plus button → dialog (max 1,000 characters) → **Create** appends one concise sentence under `## New`; page **Save** still persists.

## Delivered

- `POST /ai-prompt-helper` — `{ kind, request, currentPrompt }`; returns `{ sentence, usage, tokenUsed }`
- `apps/api/src/lib/ai-prompt-helper/` — Cursor + OpenAI providers; `promptHelper` `aiUsage` type
- `PromptHelperDialog` and plus buttons on `/prompts`
- `appendPromptHelperText` in `apps/web/src/lib/prompts.ts`
- `runAiPromptHelper` client API; AI Usage History label **Prompt Helper**
- Product and technical documentation updated

## Out of scope

- Auto-save after Create
- Helper on pages other than `/prompts`
- Coupling to Settings **Use prompt optimization using AI**

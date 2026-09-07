# Phase 37 — One-time Prompt on Workflow step

## Summary

- Add optional **One-time Prompt** textarea (8 rows) on Generate **Workflow** step, below the workflow table.
- Session-scoped only (`oneTimePrompt` in Generate session); not persisted to Prompts page or database.
- When non-empty, appended to the compiled Generate Prompt as `## One-time prompt` on `POST /ai-resume`.
- `generationInputKey` includes trimmed one-time text so resume cache invalidates when it changes.

## Outcome

- `apps/web/src/components/generate/GenerateWorkflowStep.tsx` — UI section
- `apps/web/src/lib/generate-session.ts` — session field + cache key
- `apps/api/src/routes/ai-resume.ts` — optional `oneTimePrompt` body field
- `apps/api/src/lib/prompt-optimize/compile.ts` — `appendOneTimeGeneratePrompt`

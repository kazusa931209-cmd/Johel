# Phase 85 — Combine experiences per company max

## Goal

Move the hard-coded Combine **Suggest experiences** per-company cap (previously `2–5` in the AI prompt only) into Settings / Generation.

## Outcomes

- **Schema:** `generationProcess.combineExperiencesPerCompanyMax` (`INTEGER`, default `5`, range 1–10)
- **Settings:** Generation page **Combine experiences per company** dropdown
- **Prompt:** `getCombineRecommendSystemPrompt(max)` builds pick rules from the setting (e.g. `2–5` at default, `1` when max is 1)
- **Enforcement:** `parseCombineRecommendResponse` slices `experienceIds` to the configured max per company
- **API:** `POST /ai-combine-recommend` reads the user setting from `generationProcess`

## Key files

- `apps/api/src/lib/combine-experiences-per-company.ts`
- `apps/api/src/lib/ai-combine-recommend/prompts.ts`
- `apps/api/src/lib/ai-combine-recommend/parse-response.ts`
- `apps/api/src/routes/settings-process.ts`
- `apps/web/src/app/(app)/settings/generation/page.tsx`

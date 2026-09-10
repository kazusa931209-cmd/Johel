# Phase 78 — Network traffic optimization

## Goals

1. **`POST /ai-combine-recommend`** — request body `{ generationId }` only; explicit `PUT /generations/:id` save before Suggest; server loads job / Verdict / Combine from `generations`.
2. **Slim AI POST responses** — omit `usage.input` / `usage.output` from all Generate-related AI POST handlers; keep full text in `aiUsage` table for History detail.
3. **`job.filteredJobText`** — stored on generation save so server uses the same noise-filtered JD as the client.

## Files

- API: `load-generation-input.ts`, `ai-token-used-response.ts`, AI route handlers
- Web: `generation-persistence.ts`, `CombineExperienceSuggest.tsx`, `api.ts` types

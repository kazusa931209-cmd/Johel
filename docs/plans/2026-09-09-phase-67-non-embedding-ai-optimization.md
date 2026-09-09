# Phase 67 — Non-embedding AI optimization

## Goal

Complete remaining prompt/call optimizations without embedding: Add-mode tiered pool, infra dedup, company markdown batch, direct experience save finalize, fingerprint slimming.

## Outcomes

- **67a:** Add/Quick Add Suggest uses index for all cards + full STAR for keyword top-K (10), recent N (3), and edit target
- **67b:** Workspace fingerprint is SHA-256 of ordered `id:updatedAt` pairs
- **67c:** Single `loadExperienceAdviseContext` DB load on Suggest
- **67d:** Suggest response includes `experiencesById`; client merge avoids N× GET
- **67e:** Company POST/PUT uses one batched `formatCompanyFieldsOnSave` AI call
- **67f:** Direct `POST/PUT /experiences` uses deterministic finalize only (no AI markdown)
- **67g:** Experience advisor system prompt trimmed for tiered pool layout

## Key files

- `apps/api/src/lib/experience-pool-rank/`
- `apps/api/src/lib/ai-experience-advise/load-context.ts`
- `apps/api/src/lib/ai-experience-advise/prompts.ts`
- `apps/api/src/lib/ai-markdown-format/run-company-fields-format.ts`
- `apps/web/src/lib/build-experience-advise-display-operations.ts`

## Follow-up

Phase 68 replaces keyword rank with embedding cosine + user pool-depth presets.

# Phase 68 — Experience embedding retrieval

## Goal

Replace keyword tiered pool ranking with OpenAI embedding + in-memory cosine top-K on Experience advisor Suggest. Remove Cursor provider; OpenAI API key only.

## Outcomes

- **Schema:** `experienceEmbeddings` (`experienceId`, `model`, `vector` blob); `generationProcess.experienceAdvisePoolDepth` (`compact` | `normal` | `thorough` | `full`)
- **Embedding:** `text-embedding-3-small` via OpenAI; upsert on experience create/update/advisor apply; lazy backfill on Suggest
- **Retrieval:** in-memory cosine rank; top-K by user preset + edit target + recent N=3; index always includes all cards; no top-p
- **Settings:** Generation page pool depth dropdown; Environment page OpenAI API key only (no provider picker)
- **Provider:** Cursor removed from API and `@cursor/sdk` dependency

## Key files

- `apps/api/src/lib/experience-embedding/`
- `apps/api/src/lib/openai/embeddings.ts`
- `apps/api/src/routes/ai-experience-advise.ts`
- `apps/web/src/app/(app)/settings/generation/page.tsx`

## Pool depth presets

| Preset | Full STAR cards |
|--------|-----------------|
| compact | 5 |
| normal | 10 |
| thorough | 25 |
| full | all |

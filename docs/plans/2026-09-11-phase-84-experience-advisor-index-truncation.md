# Phase 84 — Experience advisor index truncation

## Goal

Reduce Experience advisor **Suggest** input tokens on large experience pools by truncating the compact index while keeping embedding-ranked full STAR expansion unchanged.

## Outcomes

- **Threshold:** pools with ≤20 cards keep indexing every non-expanded card (no truncation)
- **Index cap by depth:** compact 20 / normal 40 / thorough 80 non-expanded index lines; **Full** depth omits the index (all cards already expanded with full STAR)
- **Selection:** index uses embedding cosine rank; expanded cards are excluded from the index (no duplicate with full STAR blocks)
- **Prompt:** truncated pools show `N of M pool cards` in the index heading; system prompt updated for the new layout
- **Settings copy:** Generation pool depth description notes index capping on large pools

## Key files

- `apps/api/src/lib/experience-embedding/select-index-ids.ts`
- `apps/api/src/lib/experience-embedding/pool-depth.ts`
- `apps/api/src/lib/ai-experience-advise/prompts.ts`
- `apps/api/src/routes/ai-experience-advise.ts`

## Index cap presets (non-expanded cards, pool > 20)

| Preset | Full STAR (unchanged) | Compact index max |
|--------|------------------------|-------------------|
| compact | 5 | 20 |
| normal | 10 | 40 |
| thorough | 25 | 80 |
| full | all | 0 (index omitted) |

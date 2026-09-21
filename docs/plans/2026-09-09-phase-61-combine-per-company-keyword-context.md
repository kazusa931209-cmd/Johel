# Combine per-company Keyword context (Phase 61)

**Date:** 2026-09-09

## Summary

Replace global Keyword guided / Auto mode on Combine **Suggest experiences** with an optional **Keyword context** on each included company card. Hybrid per-company behavior in one API call.

## Decisions

| Topic | Decision |
|-------|----------|
| Keyword context | Optional on each included company card |
| Empty | That company uses Auto (job/Verdict + role context) |
| Filled | Keyword-guided mapping for that company only |
| Keyword + low JD overlap | AI picks fewer cards (1–2) + warning |
| Global steering UX | Not implemented (no copy-to-all) |
| Run guidance (`emphasis`) | Separate from Keyword context |

## Outcome

- Removed: `combine.experienceSuggestMode`, `combine.experienceGuidanceKeywords`, API `mode` / `guidanceKeywords`
- Added: `CombineCompanyEntry.keywordContext` on session and API `companies[]`
- UI: Keyword context on `CombineCompanyCards`; simplified `CombineExperienceSuggest`
- Prompts: per-company hybrid rules in `ai-combine-recommend/prompts.ts`

## Docs

- Updated [`docs/specification.md`](../specification.md) and [`docs/technology.md`](../technology.md)

# Combine Keyword Guided Experience Selection

**Date:** 2026-09-09

## Summary

Replace manual per-card Experience picking on Combine with **Keyword guided** mode: user enters comma-separated steering keywords (e.g. `AWS, Blockchain, Senior`); AI maps shared Experience cards to each included company via `POST /ai-combine-recommend`. **Auto** mode unchanged (job/Verdict only). Suggestion dialog shows rationale and warnings before **Apply**.

## Outcome

- API: `guidanceKeywords` on `POST /ai-combine-recommend` (required when `mode: "guided"`)
- Session: `combine.experienceSuggestMode`, `combine.experienceGuidanceKeywords`
- UI: `CombineExperienceSuggest` on Combine step; `GenerateCombineSummary` shows linked categories

## Docs

- Updated [`docs/specification.md`](../specification.md) and [`docs/technology.md`](../technology.md)

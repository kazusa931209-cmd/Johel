# Phase 81 — Combine Companies & Experiences

## Summary

Merge the separate **Experiences** section into **Companies & Experiences** on the Generate Combine step.

## Changes

- Single bordered section: **Companies & Experiences**
- Title row: **Suggest experiences** (always same label) + **Reset**
- Per included company card: period, role/keyword context, inline experience list (view, delete, manual add via drawer)
- AI warnings above cards; per-company rationale under experience list after suggest
- Run notification below section after successful suggest in session only
- Run guidance (`emphasis`) kept with debounced typing (`CombineEmphasisField`)
- Removed `CombineExperienceSuggest.tsx`; logic in `useCombineExperienceSuggest`

## Files

- `apps/web/src/components/generate/useCombineExperienceSuggest.ts` (new)
- `apps/web/src/components/generate/CombineCompanyExperienceList.tsx` (new)
- `apps/web/src/components/generate/CombineExperiencePickerDrawer.tsx` (new)
- `apps/web/src/components/generate/CombineEmphasisField.tsx` (new)
- `apps/web/src/components/generate/CombineCompanyCards.tsx` (updated)
- `apps/web/src/components/generate/CombineCompanyCard.tsx` (updated)
- `apps/web/src/components/generate/GenerateCombineStep.tsx` (updated)
- `apps/web/src/components/generate/CombineExperienceSuggest.tsx` (removed)

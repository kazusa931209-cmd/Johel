# Phase 82 — Combine experience memory & per-company suggest

## Summary

Improve Generate **Combine** defaults and company-row actions.

## Changes

1. **Remember linked experiences** — `localStorage` Combine defaults now include per-company `experienceIds` (sanitized against deleted workspace experiences on load).
2. **Per-company Suggest** — Included company rows show **Suggest** left of **View**; calls `POST /ai-combine-recommend` with optional `companyId`.
3. **Include toggle hit area** — Only the checkbox and company name toggle inclusion (not the full row padding).
4. **Re-suggest confirm** — Section **Suggest experiences** and per-company **Suggest** show a confirm dialog when replacing existing links / rationale.

## Files

- `apps/web/src/lib/combine-defaults.ts`
- `apps/web/src/components/generate/useCombineExperienceSuggest.ts`
- `apps/web/src/components/generate/CombineCompanyCard.tsx`
- `apps/web/src/components/generate/CombineCompanyCards.tsx`
- `apps/api/src/routes/ai-combine-recommend.ts`
- `apps/web/src/lib/api.ts`
- i18n (`en.ts`, `ko.ts`)

# Combine Company Cards UX

## Goal

Replace the current **selected-companies table + Add dialog** flow on Generate **Combine** with a **full company card grid** where users configure each company inline.

## UX spec (confirmed)

| Element | Behavior |
|---------|----------|
| **Card list** | All workspace companies from `listCompanies("", null)` |
| **Default display** | Company **name** only in header row |
| **View** | `ViewButton` (eye) opens `CompanyDetailDialog` |
| **Include toggle** | Per card; **only included** cards are in `combine.companies` and required to have period + Role context |
| **Period** | Dual-thumb **slider** (not text inputs); **10-year** month range ending at current month; label updates live (e.g. `Jan 2023 – Present`) |
| **Role context** | Inline text input on card |
| **Experience** | **Deferred** — no picker UI; store `experienceIds: []` |
| **Suggest experiences** | **Hidden** on Combine step for this phase |

**Next-step validation (included cards only):**

- Profile selected
- At least **one included** company
- Each included company: period (both ends) + non-empty Role context
- **No** experience requirement

**Resume company order:** workspace list order from `listCompanies` (stable API order), filtered to included entries.

## Outcome (2026-09-09)

- Added `apps/web/src/lib/combine-period.ts`, `CombinePeriodSlider.tsx`, `CombineCompanyCards.tsx`
- Updated `GenerateCombineStep`, `combine-types.ts`, `GenerateCombineSummary.tsx`
- Relaxed `experienceIds` validation in API routes and `assembleFromCombineSnapshot`
- Removed `CombineCompaniesEditor.tsx`, `CombineCompanyDialog.tsx`
- Updated `docs/specification.md`, `docs/technology.md`, en/ko i18n

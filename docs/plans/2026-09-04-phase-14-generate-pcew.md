# Phase 14 — Generate PCEW step

## Goal

Implement the PCEW timeline step on Generate: selectable tables for Profile, Companies, Experiences, and Workflow; View (eye icon) detail dialogs; Prev / Next with validation; AI Filter **Next** advances from Job to PCEW.

## Scope

- `GeneratePcewStep` with four `PcewSection` tables (search, pagination, selection)
- Profile and Workflow: single selection; Companies and Experiences: multi selection
- Row click selects/toggles; View uses `ViewButton` (eye icon) and existing detail dialogs
- `PcewSelection` in page state; `validatePcewSelection` on Next
- AI Filter result dialog **Next** → `activeStep = PCEW`
- Remove Phase 11 **Choose PCEW** dialog
- Action icon rule: View = eye icon (`ViewButton`)

## Out of scope

- Verdict, Company, and Generate steps (placeholders only)
- Server-side persistence of Generate runs or PCEW selection

## Files

- `apps/web/src/components/generate/GeneratePcewStep.tsx`
- `apps/web/src/components/generate/PcewSection.tsx`
- `apps/web/src/components/generate/pcew-types.ts`
- `apps/web/src/components/generate/usePcewList.ts`
- `apps/web/src/components/shared/action-icon-buttons.tsx` — `ViewButton`
- `apps/web/src/app/(app)/page.tsx` — step state
- Removed: `ChoosePcewDialog.tsx`

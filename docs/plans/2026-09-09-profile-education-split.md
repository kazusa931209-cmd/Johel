# Profile Education Split

## Goal

Split Profile `education` into university, graduationYear, and degree; gate Combine company selection on profile selection; constrain work period slider to graduation year January through present.

## Outcome (2026-09-09)

- Schema migration `20260909100002_profile_education_split`
- Profile CRUD, form, list, detail updated; graduation year required on save
- `combine-period.ts` uses dynamic window from profile graduation year
- Combine company cards disabled until profile selected; hints document graduation-year constraint
- AI resume prompts emit structured education fields

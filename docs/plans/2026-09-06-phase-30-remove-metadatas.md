# Phase 30 — Remove Metadatas

**Date:** 2026-09-06

## Goal

Simplify Companies and Experiences by removing metadata key/value tables and UI. Remove the unused **Used** field from workflow detail responses and the workflow detail dialog.

## Scope

### Database

- Drop `companyMetadata` and `experienceMetadata` tables (migration `20260906000000_remove_company_experience_metadata`)
- Remove Prisma models `CompanyMetadata` and `ExperienceMetadata`

### API

- **Companies** — write payload `{ name, description, priority? }` only; responses omit `metadata`
- **Experiences** — write payload `{ category, description }` only; responses omit `metadata`
- **Workflows** — remove `used` from list and detail responses; delete `workflowUsed.ts` aggregation stub
- **AI Resume** — `ResumeGenerationCompany` / `ResumeGenerationExperience` no longer include `metadata`

### Web UI

- Remove Metadata column from Companies and Experiences lists
- Remove metadata sections from company/experience editors and detail dialogs
- Delete `CompanyMetadataEditor` and `ExperienceMetadataEditor`
- Remove Metadata column from `WorkflowPcewPicker` company/experience tables
- Remove **Used** from `WorkflowDetailDialog`

## Out of scope

- Profile Links (unchanged)
- Workflow metadata (already removed in Phase 22)

## Test plan

- [ ] Run migration on local database
- [ ] Create/edit company without metadata
- [ ] Create/edit experience without metadata
- [ ] Open workflow detail dialog — no Used field
- [ ] Generate resume still works with updated assemble input
- [ ] `generation-fingerprint` tests pass

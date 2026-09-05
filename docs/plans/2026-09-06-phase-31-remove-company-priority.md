# Phase 31 — Remove company priority

**Date:** 2026-09-06

## Goal

Remove the Priority field from Companies across the database, API, UI, and AI resume generation input.

## Scope

### Database

- Drop `priority` column from `companies` (migration `20260906010000_remove_company_priority`)
- Remove `@@index([userId, priority])`

### API

- **Companies** — write payload `{ name, description }` only; responses omit `priority`
- List ordered by `name` ascending; remove `nextPriority` from list response

### Web UI

- Remove Priority column from Companies list
- Remove priority field from company editor and detail dialog
- Remove Priority column from `WorkflowPcewPicker` companies table

### AI Resume

- `ResumeGenerationCompany` no longer includes `priority`

## Test plan

- [ ] Run migration on local database
- [ ] Create/edit company with name and description only
- [ ] Companies list shows Name and Description columns only
- [ ] Generate resume still works with updated assemble input
- [ ] `generation-fingerprint` tests pass

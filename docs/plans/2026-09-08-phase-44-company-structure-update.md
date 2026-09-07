# Phase 44 — Company Structure Update

## Goal

Expand the Company entity from `{ name, description }` to four required fields:

1. **Alias** (first field)
2. **Company Name** (unchanged)
3. **What this company is** (replaces the narrative part of description)
4. **Domain & Stack** (replaces the technical/scope part of description)

All user-facing copy (guidelines, examples, guidance) is in **English**.

## Data model

Updated `Company` model in `apps/api/prisma/schema.prisma`:

| Field | Type | Notes |
|-------|------|-------|
| `alias` | `String` | Required; short identifier |
| `name` | `String` | Unchanged |
| `whatCompanyIs` | `String` | Required; one-sentence company context |
| `domainAndStack` | `String` | Required; bullet-style scope/tech |
| ~~`description`~~ | — | **Removed** |

Migration `20260908000000_company_structure_update`: backfill `alias` and `name` from former `name`, `whatCompanyIs` from former `description`, `domainAndStack` to empty string.

## API

- Write payload: `{ alias, name, whatCompanyIs, domainAndStack }`
- Search across all four text fields
- Markdown on save for `whatCompanyIs` and `domainAndStack` (kinds `companyWhatItIs`, `companyDomainAndStack`)

## Resume generation

`ResumeGenerationCompany` now includes `alias`, `name`, `whatCompanyIs`, `domainAndStack` (no `description`).

## Frontend

- `CompanyForm`: four fields with guidelines, good/bad examples, shared guidance
- List columns: Alias, Company Name, What this company is
- `CompanyDetailDialog`: all four fields (markdown for prompt fields)
- `WorkflowCompanyDialog` picker: Alias, Company Name, What this company is

## Outcome

Implemented 2026-09-08. See `docs/technology.md` Companies (Phase 44) section.

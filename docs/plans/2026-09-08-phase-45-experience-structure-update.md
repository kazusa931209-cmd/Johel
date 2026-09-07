# Phase 45 — Experience Structure Update

## Goal

Expand the Experience entity from `{ category, description }` to structured prompt fields:

1. **Category** (unchanged, required)
2. **Problem** (required)
3. **Actions** (required)
4. **Outcome** (optional)

All user-facing copy (guidelines, guidance) is in **English**.

## Data model

Updated `Experience` model in `apps/api/prisma/schema.prisma`:

| Field | Type | Notes |
|-------|------|-------|
| `category` | `String` | Unchanged; required |
| `problem` | `String` | Required |
| `actions` | `String` | Required |
| `outcome` | `String` | Optional; empty string when unused |
| ~~`description`~~ | — | **Removed** |

Migration `20260908020000_experience_structure_update`: backfill `problem` from former `description`, `actions` and `outcome` to empty string.

## API

- Write payload: `{ category, problem, actions, outcome }`
- Search across category, problem, actions, and outcome
- Markdown on save for `problem`, `actions`, and non-empty `outcome` (kinds `experienceProblem`, `experienceActions`, `experienceOutcome`)

## Resume generation

`ResumeGenerationExperience` now includes `problem`, `actions`, `outcome` (no `description`).

## Frontend

- `ExperienceForm`: category plus three prompt fields with guidelines and shared guidance
- List columns: Category, Problem, Actions
- `ExperienceDetailDialog`: Problem, Actions, Outcome (markdown)
- `WorkflowCompanyDialog` picker: Category, Problem

## Outcome

Implemented 2026-09-08. See `docs/technology.md` Experiences (Phase 45) section.

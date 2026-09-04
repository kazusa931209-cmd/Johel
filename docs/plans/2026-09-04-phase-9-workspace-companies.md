# Phase 9 — Workspace Companies

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Workspace submenus **Companies** (between Profiles and Workflows) and **Experiences** (after Companies). Per-user companies list with search, pagination, add, edit, and delete. Experiences is a placeholder.

## Delivered

- Sidebar order: **Profiles** → **Companies** → **Experiences** → **Workflows** → **Generate**
- Prisma `Company` (`companies`) and `CompanyMetadata` (`companyMetadata`); per-user ownership; cascade delete metadata with company
- `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`
- Table: No, Company Name, Description, Metadata, Priority; Edit/Delete icon actions
- Search on name and description; 10 rows per page; ordered by priority then name
- Editor: `/companies/new`, `/companies/[id]/edit`; name and description required; priority 1-based (new companies default to next number); Metadata local until Save
- `/experiences` placeholder page

## Out of scope

- Experiences CRUD / wiring into Generate
- Company records used in Job Description review

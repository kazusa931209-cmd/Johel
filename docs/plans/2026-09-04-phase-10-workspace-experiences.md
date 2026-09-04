# Phase 10 — Workspace Experiences

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Replace the Experiences placeholder with per-user CRUD matching Companies/Profiles: list with search and pagination, dedicated add/edit pages, and local-until-Save metadata.

## Delivered

- Prisma `Experience` (`experiences`) and `ExperienceMetadata` (`experienceMetadata`); per-user ownership; cascade delete metadata with experience
- `GET/POST /experiences`, `GET/PUT/DELETE /experiences/:id`
- Table: No, Category, Description, Metadata; Edit/Delete icon actions
- Search on category and description; 10 rows per page; ordered by `updatedAt` desc
- Editor: `/experiences/new`, `/experiences/[id]/edit`; category and description required; Metadata local until Save
- Detail dialog on row click; delete confirm uses top-right Close (X)

## Out of scope

- Linking experiences to companies
- Wiring experiences into Generate / resume generation

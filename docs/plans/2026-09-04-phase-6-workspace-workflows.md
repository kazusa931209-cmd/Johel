# Phase 6 — Workspace Workflows

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Always-open Workspace submenus (Workflows, Generate). Per-user workflows list with filter, pagination, add, edit, delete. Generate at `/` is a placeholder.

## Delivered

- Sidebar: Workspace → Workflows (`/workflows`), Generate (`/`)
- Prisma `Workflow` without `usedCount`; `used` from post-query aggregation (0 this phase)
- `GET/POST /workflows`, `PUT/DELETE /workflows/:id`
- Table: No, Name, Description (truncated), Used, Created, Updated, Edit, Delete
- Filter + Add on one row; page size 10; toasts on API results

## Out of scope

- Usage persistence / Generate feature

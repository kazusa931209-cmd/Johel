# Phase 53 — CRUD list pagination and history back

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Profiles, Companies, Experiences, and Workflows list pages preserve page and search when returning from add/edit; forms use browser history back instead of redirecting to a bare list URL.

## Outcomes

- `useCrudListParams` — URL `?page` / `?q` on list routes
- `useCrudFormNavigation` — `router.back()` with list fallback
- `BackButton` — optional `preferHistoryBack`
- All four list pages refactored with Suspense
- All four CRUD forms wired for history back on Back, Cancel, and Save

## Scope rules

- Pagination uses `router.replace` (not push) to avoid deep history stacks
- Edit error paths still use `router.replace` to list

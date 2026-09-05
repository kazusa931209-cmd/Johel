# Phase 32 — AI Usage History drawer

**Performed:** 2026-09-06  
**Status:** Finished

## Goal

Add a global bottom-right history button on the authenticated shell that opens a right-side AI usage table drawer (100 rows per page). Row click opens a nested drawer with that run’s input and output text. Backdrop click closes the topmost drawer.

## Delivered

- `GET /ai-usage?page=` — paginated list (page size 100, newest first; omits `input` / `output`)
- `GET /ai-usage/:id` — owner-only detail with `input` and `output`
- Shared `Drawer` component and `HistoryIcon`
- `AiUsageHistory` FAB + nested history/detail drawers mounted in the authenticated app layout
- Label helpers in `apps/web/src/lib/ai-usage.ts`
- Product and technical documentation updated

## Out of scope

- Dedicated sidebar route or full-page history view
- Search/filter on usage history
- Deleting usage rows

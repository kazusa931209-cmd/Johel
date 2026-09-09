# Phase 75 — AI Usage History tabs

**Performed:** 2026-09-10  
**Status:** Finished

## Goal

Update the AI Usage History drawer with **All**, **Generation**, and **Other** tabs so users can scan every call, inspect generation-linked usage by Generation ID, or review non-generation usage without grouping.

## Product

- **All** — every AI usage call, ungrouped, newest first (100 per page).
- **Generation** — calls grouped by Generation ID, newest groups first (50 groups per page); expand a group to load its call rows.
- **Other** — AI usage not linked to a generation run, ungrouped, newest first (100 per page).
- Nested Input/Output detail drawer, pagination in the drawer footer, and row-click behavior stay the same.

## Technical

- `GET /ai-usage/groups` returns generation-linked groups only (standalone UTC date + generateType grouping removed).
- `GET /ai-usage` remains newest-first; `generationId=none` lists unlinked (Other) rows; omit `generationId` for All.
- Split `AiUsageHistory.tsx` (already over 500 lines) into `components/app/ai-usage/` (`AiUsageDetailDrawer`, `AiUsageItemsTable`, `AiUsageGroupsList`).

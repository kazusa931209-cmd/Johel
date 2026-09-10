# Phase 70 — History detail drawer

## Goal

Show generation history detail in a wide side drawer on the History list page instead of a full-page route.

## Requirements

- Remove Resume button from History table.
- Row click opens detail in a wide drawer.
- Download + Resume round icon buttons remain in drawer header.
- Legacy `/history/[publicId]` URLs redirect to `/history?publicId=…`.

## Implementation

- `GenerationHistoryDrawer` — extracted from former detail page; `Drawer` width `min(80rem, 96vw)`.
- History list syncs drawer open state to `?publicId` query param (deep links from header status).
- `[publicId]/page.tsx` — client redirect to query URL.

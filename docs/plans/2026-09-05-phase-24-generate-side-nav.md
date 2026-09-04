# Phase 24 — Generate sticky header and side navigation

## Goal

Improve Generate step navigation: sticky page title and timeline; large round chevron (and download on the last step) controls alongside step content instead of footer/header text buttons.

## Outcome

- Sticky header: title + `GenerateTimeline` with `sticky top-0 z-10 bg-background border-b`
- `GenerateStepNav` — three-column layout with sticky vertically centered side buttons (`top-1/2 -translate-y-1/2`)
- Job (Manual): right Next only; Workflow: Prev + Next; Generate: Prev + Download
- Removed inline Prev / Next / Download text bars from step components
- Shared icons: `ChevronLeftIcon`, `ChevronRightIcon`, `DownloadIcon`

## Not in scope

- Changing step logic, validation, overlays, or API behavior
- URL / File upload Next affordance

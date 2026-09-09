# Phase 69 — Resume generation from History

## Goal

Let users resume a stored generation from **Run / History** as the active Generate session.

## Requirements

- History table: **Resume** action per row (hidden for the currently active generation).
- Confirm dialog before switching.
- On confirm: save the current Generate session to History, restore the selected generation as active, navigate to Generate.

## Implementation

- **API:** `POST /generations/:publicId/resume` with optional `archive` snapshot (current run); target set to `in_progress`.
- **Web:** `resumeGenerationFromHistory`, `ResumeButton` (play icon), History page confirm dialog + toasts.
- **Session:** hydrate from API detail + cache keys; write `sessionStorage`; Generate bootstrap reads it on mount.

## Follow-up

- History detail page: Download + Resume round icon buttons in header (Download left, Resume right); detail Download uses `GenerateCircleIconButton`.

## Out of scope

- Deleting or merging duplicate in-progress rows.

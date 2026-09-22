# Phase 63 — Quick Add Experience

**Date:** 2026-09-09

## Goal

Global plus FAB above AI Usage History opens **Quick Add Experience** in a drawer — same create flow as `/experiences/new` (facts → Experience advisor → suggestion → Apply), with a nested suggestion drawer.

## Scope

- Create-only (no edit-from-FAB)
- Keep `/experiences/new` full-page entry point
- Labels: **Quick Add Experience** (`quickAddExperience.*` i18n)

## Implementation

- `useExperienceAdviseFlow` — shared advise/apply state for page and drawer
- `ExperienceFactFormFields`, `ExperienceSuggestionContent` — shared UI
- `QuickAddExperience` + `ExperienceSuggestionDrawer`
- `StudioBottomFabCluster` — vertical FAB stack (plus above history)
- Refactored `ExperienceFactForm` / `ExperienceSuggestionDialog` to use shared pieces

## APIs

No new endpoints; reuses `POST /ai-experience-advise` and apply route from Phase 54.

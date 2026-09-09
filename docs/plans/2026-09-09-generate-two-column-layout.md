# Generate Page Two-Column Layout

**Date:** 2026-09-09

## Summary

Updated the Generate page (`/`) from a single centered column to a full-width two-column step layout:

- **Left:** read-only previous-step content (empty on Job step)
- **Right:** current step (forms, AI results, loading overlays)
- Each column scrolls independently within the viewport below the sticky header

## Components

- `GenerateStepLayout` — two-column grid with independent `overflow-y-auto` panels
- `useGeneratePreviousStepPanel` — resolves previous step via `getAdjacentGenerateStep` and renders the matching preview
- `GenerateJobDescriptionPreview` — noise-filtered JD (read-only)
- `GenerateCombineSummary` — read-only Combine snapshot with profile/company/experience names

## Docs

- Product spec: `docs/specification.md` (Generate section)
- Technical notes: `docs/technology.md` (Generate UI section)

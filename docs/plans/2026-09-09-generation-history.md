# Generation History

**Date:** 2026-09-09

## Summary

Add per-run **Generation ID** to the live Generate flow, persist runs to the database, and ship **History** list + read-only detail pages under **Run** in the sidebar.

## Outcome

- Schema: `generations` table; `AiUsage.generationId` FK; migration `20260909100004_generations`
- API: `POST /generations/start`, `PUT /generations/:id`, `GET /generations`, `GET /generations/:publicId`
- Public ID format: `GEN-YYYYMMDD-NNN` (per user, per day)
- Generate: ID shown under title; persist on **+ New** and when last step reached; pass `generationId` to AI calls
- Web: `/history` list (10/page, search JD + snapshotted prompts); `/history/[publicId]` read-only detail with Download when completed

## Docs

- Updated [`docs/specification.md`](../specification.md) (Phase 62) and [`docs/technology.md`](../technology.md)

# Phase 11 — Generate UI (Job step)

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

UI-only Generate flow: prerequisites gate, timeline shell, Job step with input methods and client Noise Filter/rollback, Choose PCEW dialog, header Token Used (K/M/G/T).

## Delivered

- Prerequisites check via existing list APIs; centered alert when Profile/Company/Experience/Workflow is missing
- Timeline: Job → PCEW → Verdict → Company → Generate (Job interactive)
- Job: Manual / URL / File tabs; Noise Filter (JS); AI Filter stub; Rollback (max 3); Choose PCEW dialog (local Apply)
- Header: `Token Used: 0K` via `formatTokenUsed` (K/M/G/T)
- Components under `apps/web/src/components/generate/`

## Out of scope

- Cursor / AI Filter execution and real token accounting
- URL fetch / PDF-DOCX JD ingest on the API
- Persisting Generate runs, PCEW selection, or Job versions
- Verdict / Company / Generate step pages

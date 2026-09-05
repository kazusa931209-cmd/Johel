# Phase 28 — Invalidate Generate Cache on PCE Changes

## Goal

Regenerate resume and evaluation when Profile, Companies, Experiences, or workflow composition linked to the selected workflow change—even if job text and workflow selection are unchanged.

## Behavior

- `GET /workflows/:id/generation-fingerprint` returns a stable JSON fingerprint of assembled PCE + workflow content.
- `generationInputKey` includes `workflowContentFingerprint`.
- Workflow **Next** fetches fingerprint before cache check; PCE edits force `POST /ai-resume`.
- Generate **Next** compares current fingerprint to stored key; mismatch shows error toast to return to Workflow.

## Implementation

- `apps/api/src/lib/resume/generation-fingerprint.ts`
- `getWorkflowGenerationFingerprint` in web API client
- Updated `buildGenerationInputKey` and Generate page handlers

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`
- Phase 28 marked complete

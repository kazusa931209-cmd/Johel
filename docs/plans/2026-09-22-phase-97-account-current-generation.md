# Phase 97 — Account current generation

## Goal

Same account on different devices sees the same **current** generation (ID, timeline step, persisted run data).

## Approach

- Add `users.currentGenerationId` (FK → `generations`, `onDelete: SetNull`).
- Update pointer on `POST /generations/start`, `PUT /generations/:id`, `POST /generations/:publicId/resume`.
- `GET /generations/current` resolves via pointer (includes finalized runs until pointer moves).
- `GET /auth/me` exposes `currentGenerationPublicId` for History **Current** mark.
- Generate bootstrap always loads from `GET /generations/current`; `sessionStorage` stores only local AI cache overlay fields keyed by generation id.

## Out of scope

- Live sync while two tabs stay open (reload / re-enter Generate only).
- Server persistence of `resumeAiSnapshot`, duplicate-dismiss hash, cache keys (stay local).

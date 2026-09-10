# Phase 77 — Combine recommend ref tokens (E01/C01)

## Problem

Decoder-only models frequently typo CUID strings when asked to copy them from prompt to JSON response, causing `Unknown experienceId in response` failures on **Suggest experiences**.

## Approach

- Prompt exposes stable per-request refs: `[E01]`, `[C01]` instead of database ids.
- AI response schema uses `companyRef` / `experienceRefs`.
- Server maps refs → CUIDs deterministically before returning `companyId` / `experienceIds` to the web client.
- Web API contract unchanged; mapping is internal to `ai-combine-recommend`.

## Files

- `apps/api/src/lib/ai-combine-recommend/refs.ts` — ref map build + resolve
- `prompts.ts`, `parse-response.ts`, `index.ts` — ref-based I/O
- Tests under `__tests__/`

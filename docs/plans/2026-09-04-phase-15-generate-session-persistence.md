# Phase 15 — Generate session persistence

## Goal

Persist an in-progress Generate run across page refresh and navigation; fix double vertical scrollbar on the PCEW step.

## Scope

- `sessionStorage` keyed per user (`johel:generate-session:{userId}`)
- Persist: `activeStep`, Job state (method, text, history, accepted AI Filter markdown), PCEW selection
- Restore on Generate page load via `useGenerateSession`
- Clear storage when run is no longer in progress (empty Job step with no inputs)
- `clearGenerateSession` / `resetSession` for future “run finished” flow
- PCEW table wrappers: `overflow-x-auto overflow-y-hidden` (avoid nested vertical scroll from `overflow-x: auto`)

## Out of scope

- Server-side persistence of Generate runs
- Explicit “discard run” UI (storage clears when Job step has no in-progress data)

## Files

- `apps/web/src/lib/generate-session.ts`
- `apps/web/src/components/generate/useGenerateSession.ts`
- `apps/web/src/app/(app)/page.tsx`
- `apps/web/src/components/generate/GenerateJobStep.tsx` (controlled job state)
- `apps/web/src/components/generate/PcewSection.tsx`
- `apps/web/src/components/generate/GenerateTimeline.tsx`

# Phase 64 — Generate Run Navigation

## Summary

Separate **browse** (timeline click) from **run** (play button). Remove Previous; invalidate resume/evaluation only on explicit Run with confirm when downstream results exist.

## Approved UX

| Action | Behavior |
|--------|----------|
| Timeline click | Navigate only; show cached results |
| Run (play icon) | Next step + AI when applicable |
| Previous | Removed — use timeline |
| Invalidation | Run-only; Quick Add / edits preserve Evaluate until Run |
| Confirm | When Run would discard resume/evaluation |

## Run per step

- **Job** → Verdict + AI (or Combine if `!doVerdict`)
- **Verdict** → Combine (no AI)
- **Combine** → Generate + resume AI
- **Generate** → Evaluate + eval AI (or Download)
- **Evaluate** → Download only

## Key files

- `apps/web/src/app/(app)/page.tsx` — Run orchestrator
- `apps/web/src/components/generate/useGenerateSession.ts` — deferred invalidation
- `apps/web/src/lib/generate-session.ts` — `hasStaleDownstreamForRun`, clear helpers
- `apps/web/src/components/generate/GenerateStepNav.tsx` — Run button (play icon)

## Outcome

Implemented 2026-09-09. See `docs/technology.md` Generate UI section.

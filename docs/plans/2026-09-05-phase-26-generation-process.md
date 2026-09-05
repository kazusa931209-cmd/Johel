# Phase 26 — Generation Flow Processing

## Goal

Let users opt out of **AI Verdict** and/or **AI Evaluate** via Settings **Process** checkboxes. Generate adapts timeline and step transitions accordingly.

## Settings

- **Process** section on `/settings`
- Checkboxes: **Do Verdict**, **Do Evaluate** (both default on)
- `GET/PUT /settings/process` persists per user in `generationProcess` table

## Generate behavior

| Do Verdict | Do Evaluate | Flow |
|------------|-------------|------|
| on | on | Current 4-step flow (Job → Workflow → Generate → Evaluate) |
| off | on | Job skips AI Verdict; resume gen uses empty `acceptedMarkdown` |
| on | off | Full verdict; 3-step timeline; Download on Generate |
| off | off | Minimal: Job → Workflow → Generate → Download |

## Implementation

- `generationProcess` Prisma model + migration
- `ai-resume` accepts empty `acceptedMarkdown`
- `generate-steps.ts` helpers for visible steps and navigation
- `useResumeDocxDownload` shared hook for Generate/Evaluate download
- Conditional prompt prerequisites on Generate page

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`
- Phase 26 marked complete

# Phase 27 — Generate Process Session Handling

## Goal

Treat Generate as one process from Job through DOCX download. Avoid redundant AI calls when navigating back then forward with unchanged inputs. Add **New** reset and settings-driven reset when process flags change. Use date-prefixed DOCX filenames with workflow name.

## Behavior

- **Verdict cache:** Job **Next** reuses stored verdict when `verdictInputKey` matches noise-filtered job text.
- **Resume / evaluation cache:** unchanged from Phase 26 (fingerprint reuse on Workflow and Generate **Next**).
- **New button:** Header control resets session to blank Job step.
- **Settings reset:** Saving changed **Do Verdict** or **Do Evaluate** clears Generate session.
- **DOCX filename:** `YYYY-MM-DD-{name}-{workflow}.docx`.

## Implementation

- `verdictInputKey` in `generate-session.ts` + `setVerdictResult` in `useGenerateSession`
- Job text change clears verdict + resume + evaluation
- `buildResumeDocxFileName` in `@johel/resume`
- `workflowName` on `WorkflowSelection`, passed to download hook and `POST /resume/docx`

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`
- Phase 27 marked complete

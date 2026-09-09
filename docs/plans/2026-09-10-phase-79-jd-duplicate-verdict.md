# Phase 79 — JD duplicate check before Verdict

## Goal

Before Verdict runs on Job **Run** (when **Do Verdict** is on), detect whether the filtered JD closely matches a prior generation and confirm with the user.

## Requirements

- Embed filtered JD with `text-embedding-3-small`; store in `generationJobEmbeddings`.
- Cosine similarity threshold `0.90` against other user generations (exclude current).
- Two-panel dialog: new JD (left) vs matched JD (right).
- **Finalized match:** **Cancel** (clear Job) | **Continue** (proceed to Verdict).
- **Unfinished match:** **Cancel** | **Switch to existing** | **Continue with new JD**.
- Header **Close (X):** postpone without clearing Job or running Verdict.
- After **Continue**, skip duplicate dialog for same filtered JD until Job text changes (`jobDuplicateDismissedHash` in session).
- Check failure (e.g. no API key): toast + proceed to Verdict (non-blocking).

## Implementation

- **Schema:** `GenerationJobEmbedding` → table `generationJobEmbeddings` (migration `20260910100008_generation_job_embeddings`).
- **API:** `apps/api/src/lib/job-embedding/`; `PUT /generations/:id` sync; `POST /generations/:id/job-duplicate-check`.
- **Web:** `GenerateJobDuplicateDialog`, `useJobDuplicateFlow`, wired from Generate page `runFromJob`.
- **i18n:** `generate.jobDuplicate.*` (EN/KO).

## Out of scope

- Settings UI for threshold.
- Duplicate check when Do Verdict is off.
- URL/file JD input.

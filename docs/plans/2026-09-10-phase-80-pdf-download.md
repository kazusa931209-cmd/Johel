# Phase 80 — PDF download and Generation download format

**Date:** 2026-09-10

## Goal

Add a **Download** setting on Settings **Generation** (DOCX default, PDF) and implement English-only PDF export. Generate / Evaluate / History **Download** uses the saved format. Changing download format does not clear an in-progress Generate session.

## Decisions

- One saved format; existing **Download** button always uses it (no per-click picker).
- PDF is English-only: disabled when Resume Language is not `en`; server coerces `downloadFormat` to `docx` for non-English languages.
- Changing Docx ↔ PDF does not wipe the Generate session.

## Implementation

- `generationProcess.downloadFormat` (`docx` | `pdf`, default `docx`); migration `20260910100010_generation_download_format`.
- `GET/PUT /settings/process` extended; `normalizeDownloadFormat` coerces PDF when language is not `en`.
- Settings **Generation** page: **Download** radio section after Resume Language.
- `@johel/resume/pdf` with `pdf-lib` (Helvetica); same section order as DOCX.
- `POST /resume/pdf`; `useResumeDownload` replaces `useResumeDocxDownload`.
- `buildResumeExportFileName` generalizes filename helper for both formats.

## Tests

- PDF builder smoke (`%PDF` header).
- Filename helper for `.pdf`.
- `normalizeDownloadFormat` and `resolveDownloadFormat` coerce tests.

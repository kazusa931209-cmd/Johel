# Phase 20 — Generate resume step

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

PCEW **Next** runs AI resume generation and stores canonical `GeneratedResume` JSON in the generate session. The Generate step displays Markdown derived from that JSON and supports DOCX download from the same JSON without regenerating.

## Delivered

- Workspace package `@johel/resume` — Zod schema, `resumeToMarkdown`, DOCX builder (default template + section modules)
- `POST /ai-resume` — server loads owned PCEW entities, calls Cursor adapter, validates JSON, persists `aiUsage`
- Session fields `resume` + `generationInputKey`; resume cleared when Job or PCEW inputs change
- PCEW **Next** — fullscreen loading, fingerprint reuse, advance to Generate
- `GenerateGenerateStep` — Prev, Download (client-side DOCX), `ResumeMarkdown` display
- Vitest: schema, markdown, docx, session helpers

## Out of scope

- Resume review/edit UI
- PDF export
- Template management UI
- Server-side persistence of generated resumes
- Workflow `used` count increment

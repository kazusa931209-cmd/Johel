# Phase 48 — Labeled AI user messages

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Send Generate and Evaluate materials as labeled Markdown sections instead of one JSON blob, and give Evaluate the same job context as Generate.

## Outcomes

- Generate user prompt: Job context (with heading list) → Workflow intent → Profile → Companies in résumé order (role context, company scene, linked experiences). No JSON dump; ids and company alias omitted; empty optional profile/outcome fields skipped
- Evaluate user prompt: Job context (with heading list) → Resume Markdown
- Evaluate API and web client send `jobContext` via `buildResumeJobContext` (Verdict Markdown when Do Verdict is on)
- Prompts tab hints describe the labeled layout
- Generate/Evaluate session cache keys include `labeledUserMessageVersion` so prior JSON-dump results are not reused

## Note

Existing stored Generate / Evaluate Prompts still work; JSON-style field names in Instructions map to the labeled subsections.

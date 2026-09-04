# Phase 18 — Workspace Verdict

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Add a Workspace **Verdict** submenu between Workflows and Generate. Each user saves one **Verdict Prompt** on `/verdict` for later Job Description checking.

## Delivered

- Prisma `Verdict` → table `verdicts` (`id`, `userId` unique, `verdictPrompt`, timestamps)
- `GET /verdict` and `PUT /verdict` (upsert per user)
- `/verdict` page with required Verdict Prompt textarea; Save with inline validation and toast
- Sidebar link between Workflows and Generate
- Web client `getVerdict`, `saveVerdict`

## Out of scope

- Running Verdict against a Job Description (Generate / AI integration)
- Multiple verdict records per user
- Generate prerequisites gate on Verdict prompt

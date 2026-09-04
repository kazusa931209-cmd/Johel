# Phase 19 — Generate Job step pipeline

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Replace Job-step Noise Filter / AI Filter / Rollback buttons with a single **Next** that silently noise-filters, calls **POST /ai-verdict** (renamed from ai-filter) with the user’s Verdict Prompt, saves accepted Markdown, jumps to PCEW, and shows the result at the top of PCEW.

## Delivered

- Renamed `ai-filter` → `ai-verdict` (`POST /ai-verdict`); `GET/PUT /verdict` unchanged for prompt settings
- `sumTokenUsed` moved to `apps/api/src/lib/sum-token-used.ts`
- System prompt: user `verdictPrompt` + extraction rules; output `## Verdict`, `## Job`, `## Job post Company & contacts`
- Job step: JD textarea + **Next**; fullscreen loading; inline JD validation
- PCEW: read-only AI Verdict Markdown panel at top
- Generate prerequisites include saved Verdict Prompt
- Removed `AiFilterResultDialog`, rollback `history` from session

## Out of scope

- URL / File upload Job input
- Re-run from PCEW without returning to Job

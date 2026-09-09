# Phase 65 — Advisor Apply: skip redundant markdown format

## Goal

Remove the redundant `markdownFormat` AI call on Experience advisor **Apply** (Tier 1 of AI prompt/call optimization). Suggest→Apply drops from 2 LLM calls to 1.

## Policy

- **Direct save** (`POST/PUT /experiences`) — unchanged; AI `formatExperienceFieldsOnSave` when STAR fields change
- **Advisor Apply** (`POST /ai-experience-advise/apply`) — `finalizeExperienceFieldsForAdvisorApply` only (deterministic cleanup + validation)

## Implementation

- [`apps/api/src/lib/ai-experience-advise/apply.ts`](../apps/api/src/lib/ai-experience-advise/apply.ts) — `finalizeExperienceFieldsForAdvisorApply`, `persistExperienceFieldsFromAdvisorApply`; no import of `formatExperienceFieldsOnSave`
- Tests: [`apps/api/src/lib/ai-experience-advise/__tests__/apply.test.ts`](../apps/api/src/lib/ai-experience-advise/__tests__/apply.test.ts)

## Docs

- [`docs/specification.md`](../specification.md) — Phase 65, Shared Experiences Apply note
- [`docs/technology.md`](../technology.md) — Experiences, AI Markdown Format, Architecture API list, AI prompt optimization section

## Follow-up (not this phase)

- Tier 2: tiered pool on Suggest
- Tier 3: embedding hybrid retrieval

# Phase 66 — Edit-mode tiered experience pool (Tier 2)

## Goal

Cut Experience advisor **Suggest** input tokens on **Edit** without embedding/RAG: full STAR for the edit-target card only; compact index for all other pool cards.

## Behavior

| Mode | `targetExperienceId` | Pool in prompt |
|------|----------------------|----------------|
| Add / Quick Add | none | Full STAR for every card |
| Edit | set | Full STAR for target; index lines for others |

Index format matches Combine: `- {id}: {category} — {problemSummary}` (first non-empty problem line, max 200 chars).

## Implementation

- [`apps/api/src/lib/ai-experience-advise/prompts.ts`](../apps/api/src/lib/ai-experience-advise/prompts.ts) — `formatExperiencePoolForAdvise`, tiered vs full helpers; system prompt note for index-only cards
- [`apps/api/src/lib/experience-problem-summary.ts`](../apps/api/src/lib/experience-problem-summary.ts) — shared summary helper (Combine index reuses)
- Tests: [`apps/api/src/lib/ai-experience-advise/__tests__/prompts.test.ts`](../apps/api/src/lib/ai-experience-advise/__tests__/prompts.test.ts)

## Docs

- [`docs/specification.md`](../specification.md) — Phase 66, Shared Experiences Suggest note
- [`docs/technology.md`](../technology.md) — API + AI prompt optimization Tier 2

## Follow-up (not this phase)

- Tier 3: optional embedding hybrid retrieval for large pools on create mode

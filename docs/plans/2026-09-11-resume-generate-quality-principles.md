# Resume Generate quality principles (Phase 86)

## Goal

Improve resume output quality for all JDs via always-on Generate rules—not one-off JD fixes.

## Problems addressed

- Experience bullets merged tech/metrics across linked cards (laundry lists).
- Employment period + tool inventory read as full-tenure use (including post-start releases).
- Multi-cloud/platform names synthesized across cards (EKS + GKE + Vertex + Azure).
- Same quantified outcome repeated across employer blocks (shared cards).
- Skills capped at 12 JD-intersection items—too sparse for senior profiles.
- Keyword context steered Combine Suggest only; Generate never saw it.

## Implementation

1. **Pipeline** — `keywordContext` on `combine.companies[]` → `assembleFromCombineSnapshot` → `ResumeGenerationCompany` → `formatCompaniesSection` (`Keyword context:` line).
2. **Default Generate Prompt** (`@johel/prompt-defaults`) — card isolation, tech density, tenure wording, multi-cloud limits, cross-company metric dedup, Skills 12–20.
3. **Execution rules** (`apps/api/src/lib/ai-resume/prompts.ts`) — mirror core constraints for custom prompts.
4. **Tests** — `assemble-input.test.ts`, `prompts.test.ts` keyword + execution rules.
5. **Docs** — `specification.md` (Phase 86 + product principles), `technology.md`, `workspace-authoring.md`.

## Out of scope

- Tech release-date registry.
- Post-AI lint or rewrite passes (prompt-only enforcement).

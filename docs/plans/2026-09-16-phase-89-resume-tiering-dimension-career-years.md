# Phase 89 — Resume tiering, dimension mode, and career years fix

## Goal

Fix Summary career years mismatch, reduce repetitive Experience bullets across companies, and apply 1/2 JD tiering by Combine selection order.

## Problems addressed

- AI wrote wrong `+N years of experience` and post-processing kept it when the pattern already existed.
- All companies were pushed equally toward JD rubric mapping, causing repetition.
- Same capability at multiple companies reused the same framing.

## Implementation

1. **Career years** — `replaceSummaryCareerYearsLead` overwrites AI `+N` with server-computed sum of Combine company periods.
2. **Policy module** — `apps/api/src/lib/resume-generation-policy.ts` (tier weights, dimension modes, prompt fragments).
3. **Settings** — `generationProcess.experienceDimensionMode` (`star_axis` | `jd_signal` | `technical_facet` | `problem_item`); Generation settings dropdown.
4. **Combine Suggest** — per-company `JD selection weight`, dimension mode, role-context cap, keyword × tier.
5. **Generate** — per-company `JD tailoring weight`, execution rules for Summary/Skills full JD vs tiered Experience bullets; default Generate Prompt updated.

## Policy summary

- Company order: `combine.companies` selection order (index 0 = 100%).
- Tier formula: `100% × 0.5^index` for Experience bullets only.
- Priority: role context cap → 1/2 tier → keyword context (keyword × tier).
- Career years: simple sum of periods; server overwrite.

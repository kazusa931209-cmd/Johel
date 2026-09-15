# Phase 90 — Resume naturalness and configurable JD tier decay

## Goal

Reduce Summary job-application phrasing and Experience bullet JD keyword stuffing; make JD tier decay configurable in Settings / Generation.

## Problems addressed

- Summary opened with "targeting [Role] roles" — meta job-search language on the resume itself.
- Experience bullets chained too many JD keywords (ETL pipeline stages, rubric items) in one bullet.
- Fixed 50% JD tier decay (100% → 50% → 25%) felt too aggressive; third company bullets often disconnected from JD.

## Implementation

1. **Prompt naturalness** — Default Generate Prompt + execution rules: Summary expertise-first (no "targeting roles"); one accomplishment per bullet with bad/good ETL example; lower-tier coherence guidance.
2. **Configurable decay** — `generationProcess.experienceJdTierDecayPercent` (30 | 50 | 70 | 80; default 80); formula `100% × (decay/100)^index`.
3. **Policy module** — `computeJdTierWeight`, dynamic tier rules in Combine/Generate prompts.
4. **Settings UI** — Generation page select with example-rich tier chains (EN/KO).

## Policy summary

- Default decay: 80% → tiers 100%, 80%, 64%, …
- Summary and Skills: full JD (unchanged).
- Experience bullets: tiered by selection order × decay setting.

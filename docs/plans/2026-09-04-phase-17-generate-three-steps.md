# Phase 17 — Generate three steps

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Collapse the Generate timeline to **Job → PCEW → Generate**. Remove the Verdict and Company steps, the Phase 16 verdict runner (`POST /verdict`, `ai-verdict`), and workflow **Verdict Prompt** (editor, API, `workflows.verdictPrompt` column).

## Delivered

- Timeline: `GENERATE_STEPS = ["Job", "PCEW", "Generate"]`; PCEW **Next** → Generate
- Removed `GenerateVerdictStep`, verdict session state, and Company placeholder step
- Session migration: stored `activeStep` `Verdict` / `Company` → `Generate`
- Deleted `apps/api/src/lib/ai-verdict/`, `apps/api/src/routes/verdict.ts`, web `runVerdict`
- Workflow editor: no Verdict Prompt field; API payloads `{ name, description?, language, metadata }`
- Prisma migration drops `workflows.verdictPrompt`

## Out of scope

- Workspace Companies CRUD and PCEW company multi-select (unchanged)
- Implementing the Generate résumé step

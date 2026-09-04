# Phase 16 — Generate Verdict step

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Implement the Generate Verdict timeline step: call the configured AI Agent with a simple system prompt, using an editable session-only Verdict Prompt initialized from the selected workflow (never written back), against the accepted AI Filter Markdown.

## Delivered

- `apps/api/src/lib/ai-verdict/` — prompts, Cursor provider, `runAiVerdict`
- `POST /verdict` — `{ workflowId, jobMarkdown, verdictPrompt }`; ownership + language from workflow; request prompt for AI; `aiUsage` persistence
- `GenerateVerdictStep` — editable prompt + session-only notice + Reset; Run/Retry; Markdown result; Prev/Next; fullscreen loading
- Session: `verdict.prompt` + `verdict.markdown` in `sessionStorage`
- Web client `runVerdict`; header Token Used refresh after success

## Out of scope

- Company / Generate steps
- Writing edited prompt to `workflow.verdictPrompt`
- PCEW profile/companies/experiences in the Verdict prompt
- Additional AI providers beyond Cursor

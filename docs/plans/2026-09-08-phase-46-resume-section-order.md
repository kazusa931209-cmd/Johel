# Phase 46 — Resume section order and prompt seeds

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

- Render generated résumés as Summary → Experience → Skills → Education (Skills stay visible).
- Seed new accounts with Verdict/Generate templates that share the same heading contract.

## Outcomes

- `resumeToMarkdown` and `docx-builder/templates/default.ts` use the same section order
- `@johel/prompt-defaults` Verdict prompt uses Role / Technical Requirements / Final Verdict sections
- Generate default prompt maps those headings and caps skills (3–5 groups, 12 items)
- Existing users keep stored prompts until they save the new text on `/prompts`

## Note

JSON schema field order in `ai-resume/prompts.ts` matches the template (experiences before skills). Display order is still owned by the template, not the Generate Prompt.

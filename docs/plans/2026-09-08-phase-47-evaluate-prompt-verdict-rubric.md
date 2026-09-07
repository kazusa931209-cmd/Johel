# Phase 47 — Evaluate Prompt aligned with Verdict

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Default Evaluate Prompt uses the same scoring dimensions as Verdict / Generate (Role, Technical Requirements, Final Verdict, and related sections). New sign-ups receive it from `@johel/prompt-defaults`.

## Outcomes

- `DEFAULT_EVALUATE_PROMPT` rewritten for that rubric; Required weighted over Preferred; Mentioned-only is not a must-have
- Evaluate execution rules: use Verdict headings when present, otherwise derive the same dimensions from the filtered job description (Evaluate still receives noise-filtered JD, not Verdict Markdown)
- Prompts Evaluate tab shows `EVALUATE_PROMPT_JOB_HINT`

## Note

Existing users keep their stored Evaluate Prompt until they save the new text on `/prompts`.

# Phase 40 — User-owned prompt pipeline

Unify Verdict, Generate, and Evaluate prompt handling: user-defined structure, `#`/`##` hierarchy separation, default templates on sign-up, and explicit no-quality-guarantee philosophy.

## Outcomes

- `@johel/prompt-defaults` — shared default Verdict / Generate / Evaluate templates
- `POST /auth/register` creates `prompts` row with defaults
- Auto Markdown Format: prompt kinds capped at `##` (AI rule + `capPromptHeadings` post-process)
- `compileInstruction`: `# Instructions` + `PROMPT_SECTION_SEPARATOR` (`----------------------------------------`)
- AI Verdict / Generate / Evaluate: `# Execution rules` only (no fixed output sections)
- `docs/specification.md` — **Philosophy** section (JoHEL does not guarantee output quality)

## Technical

- `PROMPT_COMPILER_VERSION` → `2`
- One-time Generate prompt uses `# One-time prompt` + same separator

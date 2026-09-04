# Phase 23 — Refine sidebar and Prompts

Rename Verdict workspace menu to **Prompts** (`/prompts`). Add **Generate Prompt** alongside Verdict Prompt. Sidebar sections **Workspace** and **Run** (Generate under Run); section labels use normal title case.

## Outcomes

- API: `GET/PUT /prompts` with `{ verdictPrompt, generatePrompt }`; `verdicts.generatePrompt` column
- `POST /ai-resume` requires saved Generate Prompt (prepended to system prompt)
- Web: `/prompts` page; `/verdict` redirects; sidebar Workspace + Run sections
- Generate prerequisites: Workflow + both prompts

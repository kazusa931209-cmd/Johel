# Phase 25 — Generate Evaluate Step

## Goal

Add a fourth Generate timeline step (**Evaluate**) that runs AI evaluation after resume generation, keeps **Next** on the Generate step, and moves **Download** to Evaluate.

## Flow

```
Job → Workflow → Generate → Evaluate
         |           |          |
    AI Verdict   AI Resume   AI Evaluate → DOCX Download
```

| Step | Right nav | Action |
|------|-----------|--------|
| Job / Workflow | Next (chevron) | Unchanged |
| Generate | Next (chevron) | `POST /ai-evaluate`, advance to Evaluate |
| Evaluate | Download | `POST /resume/docx` |

## Backend

- New route `POST /ai-evaluate` with body `{ jobDescription, resume }`
- Lib under `apps/api/src/lib/ai-evaluate/` (cursor + openai providers)
- OpenAI model: `gpt-5.6-luna` (same as AI Verdict) with low reasoning
- User **Evaluate Prompt** from `/prompts` (`prompts.evaluatePrompt`) plus provider output notes
- Resume converted server-side with `resumeToMarkdown`

## Frontend

- Timeline: add **Evaluate** step
- Session: `evaluationMarkdown`, `evaluationInputKey`; cleared when resume invalidates
- `GenerateGenerateStep`: Next + evaluating overlay (no Download)
- `GenerateEvaluateStep`: Markdown result + Download
- `page.tsx`: `onGenerateNext` with evaluation reuse logic

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`
- Phase 25 marked complete

# Phase 43 — Prompts tabbed save

## Goal

Split Workspace **Prompts** into **Verdict**, **Generate**, and **Evaluate** tabs. Each tab edits and saves one prompt independently (no single page Save for all three).

## API

- Keep `GET /prompts` (all three fields)
- Replace bulk `PUT /prompts` with:
  - `PUT /prompts/verdict` — `{ verdictPrompt }`
  - `PUT /prompts/generate` — `{ generatePrompt }`
  - `PUT /prompts/evaluate` — `{ evaluatePrompt }`
- Each save runs markdown conversion only for the submitted field; response returns all three prompts

## Web

- `/prompts?tab=verdict|generate|evaluate` (default `verdict`)
- Tab bar + one prompt panel per tab with its own **Save**
- Generate prerequisite links open the matching tab

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`
- Phase 43 marked complete

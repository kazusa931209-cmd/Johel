# Phase 29 — Prompt Optimization

## Goal

Before AI Verdict, Generate, and Evaluate run, optimize each saved user prompt (Verdict / Generate / Evaluate) without changing stored prompts or codebase const system prompts.

## Behavior

- **Deterministic compile (always):** trim, wrap user instruction, Generate adds honesty line.
- **LLM rewrite (optional):** Settings **Prompt Optimization** → **Use prompt optimization using AI** (default on). When off, skip AI rewrite.
- Cached by `(userId, kind, sourceHash)` in `promptOptimizations`.
- Generate cache keys include prompt hashes and optimization flag; toggling the setting resets Generate session.

## Implementation

- `apps/api/src/lib/prompt-optimize/` — compile, hash, rewrite, `optimizeInstruction`
- `GET/PUT /settings/prompt-optimization`
- `generationProcess.usePromptOptimizationAi` + `promptOptimizations` table
- Wired into `POST /ai-verdict`, `POST /ai-resume`, `POST /ai-evaluate`
- Settings UI section between Process and AI Agent

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`

# Phase 13 — AI Filter

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Implement AI Filter for Generate Job: call the configured AI Agent Provider with a provider-specific system prompt, extract Job and Job post Company & contacts as Markdown, persist token usage in `aiUsage`, show a Markdown result dialog, and aggregate Token Used in the header.

## Delivered

- Prisma `AiUsage` → table `aiUsage`
- `POST /ai-filter` and `GET /ai-usage/summary`
- Cursor provider adapter via `@cursor/sdk` `Agent.prompt` with provider-specific prompts
- Web: fullscreen loading, `AiFilterResultDialog` (`react-markdown`), Discard / Retry / Next, backdrop dismiss disabled
- `AiUsageProvider` refreshes header Token Used after successful runs

## Out of scope

- Additional AI providers beyond Cursor
- Persisting Generate runs / accepted AI Filter Markdown server-side
- Verdict / Company / Generate step pages

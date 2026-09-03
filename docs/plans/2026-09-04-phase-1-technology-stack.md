# Phase 1 — Technology Stack Proposal

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Obtain approval for a concrete stack that satisfies `docs/specification.md`, record it in `docs/technology.md`, add the plan-archive Cursor rule, store this plan under `docs/plans/`, and check Phase 1 as finished. **No application code in this phase.**

## Constraints mapped to choices

| Spec constraint | Stack implication |
| --- | --- |
| Local deployment | Single self-hosted app process; no cloud-required runtime |
| No operational external-service cost | SQLite on disk; no paid auth/DB/hosting SaaS; LLM billed only via user-owned keys |
| Multi-user + email login | Local email/password accounts |
| Cursor API key now; OpenAI/Anthropic later | LLM provider interface; first adapter = Cursor SDK |
| JD via URL / file / manual; PDF & DOCX out | Local HTTP fetch + parsers; local document libraries |

## Proposed stack (chosen defaults)

- **Language / runtime:** TypeScript on Node.js (LTS)
- **App framework:** Next.js (App Router) — UI + API routes in one local app (`next dev` / `next start`)
- **UI:** React + Tailwind CSS (no paid UI SaaS)
- **Database:** SQLite via Prisma (local file; multi-user data without a hosted DB)
- **Auth:** Auth.js (NextAuth) **Credentials** provider — email + password, sessions stored locally; no OAuth/IdP required
- **Secrets / API keys:** Per-user encrypted storage of LLM API keys (Cursor now; OpenAI/Anthropic later); app itself needs no paid third-party key to run
- **LLM:** Provider abstraction
  - **Current:** `@cursor/sdk` with the user’s Cursor API key
  - **Later:** OpenAI / Anthropic adapters behind the same interface
- **Job Description ingest:**
  - Manual: form text (cap 10,000 chars)
  - URL: server-side `fetch` + HTML text extraction (e.g. cheerio) — no scraping SaaS
  - File: local parsers (e.g. `pdf-parse`, `mammoth` for DOCX/text)
- **Resume export:** `docx` for DOCX; `@react-pdf/renderer` (or `pdf-lib`) for PDF — generated on the server, no paid render service
- **Config / templates:** Natural-language template settings stored in SQLite and applied via LLM prompts (product behavior stays in the spec; prompt/schema details in `technology.md` as they are decided)
- **Package manager:** pnpm
- **Testing (when we reach that work):** Vitest + Playwright

## Cursor rule addition (plan archive)

Rule 8: Once a Cursor plan is built (approved / executed for a phase), store a copy under `docs/plans/` with filename prefix `YYYY-MM-DD` and a short slug.

## Outcomes

- Stack approved and recorded in `docs/technology.md`
- Plan-archive Cursor rule added to `docs/specification.md` and `.cursor/rules/documentation.mdc`
- This plan archived at `docs/plans/2026-09-04-phase-1-technology-stack.md`
- Phase 1 marked finished in `docs/specification.md`

## Out of scope

- Scaffolding the Next.js app, schema, auth, or LLM wiring
- Defining Phase 2 content

# Phase 12 — Noise Filter

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Replace the Phase 11 regex Noise Filter stub with an extensible, deterministic pipeline that reduces web-page noise before AI Filter, with diagnostics and Vitest coverage.

## Delivered

- Product definitions for Noise Filter and AI Filter in `docs/specification.md`
- Module `apps/web/src/lib/noise-filter/` with pipeline: Normalize → HTML → Markdown → Boilerplate → Duplicate → Navigation → Section → WalletAddress → DeJob
- Public API `noiseFilter(raw)` returning `{ text, originalLength, currentLength, reductionRate, diagnostics }`
- `createNoiseFilterPipeline(extraFilters?)` includes core + default plugins (WalletAddress, DeJob) + optional extras
- Plugins: WalletAddress (`0x` full + truncated); DeJob (chrome lines + tagline regexp + “View more jobs of … >”)
- HTML parsing via `node-html-parser` (regex fallback)
- Compatibility wrapper in `apps/web/src/lib/jobNoiseFilter.ts`
- Generate Job toast shows reduction % and char counts
- Vitest suite (`pnpm --filter web test`) including BIT / Golang Engineer regression fixture

## Out of scope

- AI Filter execution
- Additional site-specific filters (LinkedIn, Greenhouse, etc.)
- API/server route for filtering
- URL / file JD ingest

# Phase 51 — Quick Experience experience draft guardrails

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Harden Quick Experience authoring for shared Experience cards: forbid employer names in STAR drafts, require delta-only AI output on update, and merge existing card text with AI additions in the Suggestion drawer before Apply (WYSIWYG, no content loss).

## Outcomes

- Advisor system prompt: no employer names in Experience draft fields; `update_experience` delta-only contract
- `mergeExperienceFieldUpdate` helper (API + web) with unit tests
- `QuickExperience.handleNext` merges existing experience + AI delta for `update_experience`
- Suggestion drawer hint and Experience editor guidance (en/ko)
- Docs: specification Phase 51, workspace-authoring employer-name rule, technology Quick Experience merge note

## Scope rules

- Apply saves merged textarea as-is (no server-side append)
- Rationale may still name workflow/company for targeting
- `create_experience` still requires full STAR fields

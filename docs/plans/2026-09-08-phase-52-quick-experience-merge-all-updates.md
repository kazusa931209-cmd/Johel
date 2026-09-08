# Phase 52 — Quick Experience merge for all update placements

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Extend Phase 51 merge-before-Apply to all Quick Experience update placements: company scene fields, role context, and workflow description.

## Outcomes

- Advisor delta-only rules for `update_company`, `update_role_context`, `update_workflow_description`
- `buildAuthorAdviseDisplayDraft` merges existing stored text with AI delta for all four update placements
- Generalized Suggestion drawer `updateMergeHint` (en/ko)
- Docs: specification Phase 52, technology Quick Experience merge note

## Scope rules

- WYSIWYG Apply (no server-side append)
- Reuses `mergeExperienceFieldUpdate` for all text fields
- `create_experience` / `link_existing` unchanged (full draft by design)

# Phase 49 — Quick PCE authoring advisor

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Global **Quick PCE** plus FAB beside AI Usage History: optional workflow scope, “What do you need?” input, AI placement suggestion, confirmed Apply to Company / Experience / Workflow links. No RAG, no tool calling.

## Outcomes

- `POST /ai-author-advise` — scoped or all-workflow graph + user facts → JSON proposal + workspace fingerprint
- `POST /ai-author-advise/apply` — fingerprint-checked deterministic writes (create/update experience, company, workflow link, role context, description)
- `StudioBottomFabCluster` — history + plus FABs; `QuickPce` / `QuickPceSuggestionDrawer` nested drawers
- `authorAdvise` AI usage type (label **Quick PCE**); `johel:workspace-updated` clears stale Generate session resume/evaluation
- Product/tech docs and [`workspace-authoring.md`](../workspace-authoring.md) Quick PCE section

## Scope rules

- Workflow selected → graph = that workflow’s profile, companies, linked experiences only
- No workflow → all workflows’ linked PCE graphs (unused workspace pool excluded)

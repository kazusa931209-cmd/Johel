# Phase 91 — Remove Company Domain & Stack

## Goal

Remove the **Domain & Stack** company field; company scene for Generate and Combine Suggest uses **What this company is** only.

## Decisions

- Existing `domainAndStack` DB data: **drop** (no merge into `whatCompanyIs`).
- Domain & Stack authoring guidance: **remove**; What this company is guidance unchanged.

## Implementation

1. Migration drops `companies.domainAndStack`.
2. Companies API, form, list, detail — field removed.
3. Markdown on save — `whatCompanyIs` only via `formatMarkdownOnSave` / simplified `formatCompanyFieldsOnSave`.
4. Resume assembly, Combine Suggest, Generate prompts — `whatCompanyIs` only for scene grounding.

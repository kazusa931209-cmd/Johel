# Phase 71 — Workspace PCEW bundle endpoint

## Problem

Entering Generate **Combine** or **Generate** triggered duplicate `GET /profiles`, `GET /companies`, and `GET /experiences` calls from child components (`CombineProfilePicker`, `CombineCompanyCards`, `GenerateCombineSummary`, `CombineExperienceSuggest`).

## Solution

- **`GET /workspace/pcew`** — returns all profiles, companies, and experiences for the user in one response (same shapes as list endpoints, unpaginated).
- **`loadWorkspacePcew` / `useWorkspacePcew`** — module-level cache dedupes in-flight and repeat reads across Generate UI.
- Generate prerequisites on `/` use the same loader so the first visit warms the cache before Combine mounts.

## Files

- API: `apps/api/src/lib/workspace-pcew.ts`, `apps/api/src/routes/workspace-pcew.ts`
- Web: `apps/web/src/lib/workspace-pcew.ts`, updated Combine/Generate components

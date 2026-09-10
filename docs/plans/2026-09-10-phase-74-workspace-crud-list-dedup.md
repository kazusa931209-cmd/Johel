# Phase 74 — Workspace CRUD list fetch deduplication

## Problem

Profiles, Companies, and Experiences list pages called `GET /profiles`, `GET /companies`, or `GET /experiences` twice on visit due to React Strict Mode remounts and unstable `load` callback dependencies (`toast`, `t`).

## Solution

- `apps/web/src/lib/cached-crud-list.ts` — cache + in-flight dedupe keyed by `(q, page)` per resource
- List `useEffect` depends on `[q, page]` only (same pattern as History)
- `invalidateWorkspaceCrudCaches(resource)` on delete/save; clears matching list cache and `PCE` bundle cache

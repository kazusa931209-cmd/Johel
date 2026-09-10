# Phase 72 — Rename PCEW to PCE

## Rationale

**PCEW** included **W** for “workspace,” which no longer exists as a product concept. **PCE** = Profile, Company, Experience.

## Changes

| Before | After |
|--------|--------|
| `GET /workspace/pcew` | `GET /pce` |
| `WorkspacePcew`, `getWorkspacePcew` | `PceBundle`, `getPce` |
| `loadWorkspacePcew`, `useWorkspacePcew` | `loadPce`, `usePce` |
| `PcewSection` | `PceSection` |
| `generate.pcewSection.*` i18n | `generate.pceSection.*` |

Legacy session keys (`pcew`, step name `PCEW`) remain readable for stored sessions only.

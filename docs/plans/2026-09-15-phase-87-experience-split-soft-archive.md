# Phase 87 — Experience split and soft archive

## Goal

Reduce resume-generation token load and mixed-capability bleed by splitting dense/mixed experience cards into focused capability cards, without item-level schema change.

## Scope

- `experiences.deletedAt` soft archive (global Delete + split source archive)
- Live pool only for list, PCE, advisor, Combine Suggest, resume assembly
- AI split: `POST /ai-experience-split` + `/apply`
- Density heuristics + Experiences UI (badge, split drawer)
- Combine sanitize toast when archived/missing links stripped

## Out of scope

- ExperienceItem table / item-level Combine linking
- Restore archived UI
- Auto-replace archived ids in active Combine

## Outcome

Implemented 2026-09-15. See `docs/technology.md` Experiences (Phase 87).

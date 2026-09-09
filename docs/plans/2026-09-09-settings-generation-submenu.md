# Settings Generation Submenu

**Date:** 2026-09-09

## Summary

Add **Settings → Generation** (`/settings/generation`) between Environment and Prompts. Move **Process** (Do Verdict / Do Evaluate) from Environment to Generation. Move **Résumé Language** from the Generate Combine step to Generation settings, persisted per user on `generationProcess.resumeLanguage`.

## Outcome

- Sidebar order: Environment → **Generation** → Prompts
- Generation page: Process checkboxes + Résumé Language select; single Save via `PUT /settings/process`
- Environment page: Theme, UI Language, AI Agent only
- Combine step: profile, companies, Run guidance (no language picker)
- Generate page syncs `combine.language` from saved `resumeLanguage`
- Changing Generation settings clears in-progress Generate session

## Technical

- Migration `20260909100003_generation_resume_language`
- `GET/PUT /settings/process` includes `resumeLanguage` (`en` | `ja` | `zh-TW` | `zh-CN` | `ko`)

## Docs

- Updated [`docs/specification.md`](../specification.md) and [`docs/technology.md`](../technology.md)

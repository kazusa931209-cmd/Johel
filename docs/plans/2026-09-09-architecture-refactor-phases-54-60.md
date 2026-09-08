# Architecture refactor — Phases 54–60

**Performed:** 2026-09-09  
**Status:** Finished

## Summary

Replaced Workflow presets with per-run **Combine**, added **Experience fact-input** authoring, removed **Quick Experience**, split **Verdict** into its own Generate step, added **Combine AI assist**, and introduced **prompt governance** (user extensions + admin full prompts).

## Phases

| Phase | Deliverable |
| --- | --- |
| 54 | Experience fact-input (`POST /ai-experience-advise`), Experiences add/edit UX |
| 55 | Quick Experience FAB and `ai-author-advise` removed |
| 56 | Generate timeline: Job → Verdict → Combine → Generate → Evaluate |
| 57 | Combine snapshot + `assembleFromCombineSnapshot`, `run` meta in resume input |
| 58 | Workflow CRUD/DB/recommendation removed |
| 59 | `POST /ai-combine-recommend` + Suggest experiences on Combine step |
| 60 | `User.role`, prompt extensions, admin-only full prompt edit |

## Migrations

1. `20260909100000_remove_workflows` — drop workflow tables; simplify `generationProcess`
2. `20260909100001_user_role_prompt_extensions` — `users.role`, prompt extension columns

Run: `pnpm db:migrate`

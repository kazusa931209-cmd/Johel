# Phase 42 — Descriptions as resume prompts

Company, Experience, and Workflow **Description** fields are required and documented as prompts used during resume generation.

## Outcomes

- `DESCRIPTION_AS_RESUME_PROMPT_HINT` in `apps/web/src/lib/entity-description.ts`
- Company / Experience / Workflow editor forms show the hint; Workflow description now required (red asterisk + inline validation)
- API `POST/PUT /workflows`: `description` required (`trim`, min 1, max 2000)
- Prisma `workflows.description` non-null with default `""`; migration backfills nulls

## Note

Company and Experience descriptions were already required; this phase adds the prompt UX and makes Workflow description required to match.

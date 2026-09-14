# Extract JD Company / Role from Verdict

Built plan — implemented 2026-09-15.

## Summary

- Removed manual **JD Company Name** / **JD Role** inputs from the Job step.
- When **Do Verdict** is on: extract from Verdict Markdown via `@johel/jd-meta` after `POST /ai-verdict`; editable fields on the Verdict step.
- When **Do Verdict** is off: `POST /ai-jd-meta` lightweight JSON extraction on Job Run; editable fields at top of Combine.
- Validation before advancing past Verdict or Combine (when Verdict disabled).

## Key files

- `packages/jd-meta/` — shared parser
- `apps/api/src/routes/ai-verdict.ts`, `apps/api/src/routes/ai-jd-meta.ts`
- `apps/web/src/components/generate/GenerateJdMetaFields.tsx`
- `apps/web/src/app/(app)/page.tsx` — orchestration

See [`docs/technology.md`](../technology.md) and [`docs/specification.md`](../specification.md) for product and API details.

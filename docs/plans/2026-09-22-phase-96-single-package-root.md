# Phase 96 — Single package at repo root

## Goal

Collapse the pnpm workspace (`apps/web` + `packages/*`) into one deployable Next.js package at the repository root.

## Changes

| Area | Outcome |
| --- | --- |
| Layout | `src/`, `prisma/`, `public/`, `scripts/*.ts` at repo root; removed `apps/` and `packages/` |
| Former `@johel/*` libs | `src/packages/resume`, `jd-meta`, `prompt-defaults` with TS path aliases (imports unchanged) |
| Tooling | Root `package.json` owns all deps; deleted `pnpm-workspace.yaml` |
| CI | Single **ci** job: test, lint, build |
| Docker / Vercel | Root Directory `.`; standalone `server.js` at image root |
| Legacy `apps/api` | Removed with `apps/` |

## Operator follow-up

- Vercel: set **Root Directory** to `.` (was `apps/web`).
- Local: use root `.env` from `.env.example`; `pnpm dev` (alias `pnpm dev:web`).

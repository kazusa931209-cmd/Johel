# Phase 4 — Studio Web Shell

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Authenticated UI as a studio layout: JoHEL top bar, user menu (Profile / Sign out), left nav (Workspace / Settings), dark-default theme with light/dark switch.

## Delivered

- `StudioHeader`, `StudioSidebar`, `ThemeProvider`
- Theme key `johel-theme` in `localStorage`; default dark
- Routes: `/` Workspace, `/settings` theme switch, `/profile` email
- Spec UX section + `technology.md` studio shell notes
- `pnpm --filter web build` succeeded (all routes)

## Out of scope

- JD / resume / API-key feature UI
- Phase 5

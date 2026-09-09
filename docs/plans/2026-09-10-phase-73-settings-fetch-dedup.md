# Phase 73 — Settings fetch deduplication

## Problem

Settings pages fired duplicate reads:

- **Environment:** `GET /settings` twice (Strict Mode remount)
- **Generation:** `GET /settings/process` from page + `GenerateStatusProvider` in app layout
- **Prompts:** `GET /prompts` and `GET /auth/me` from page + layout (`getMe`)

## Solution

`apps/web/src/lib/cached-settings.ts` — module-level cache + in-flight dedupe for:

- `loadSettings` → `GET /settings`
- `loadGenerationProcess` → `GET /settings/process`
- `loadPrompts` → `GET /prompts`
- `loadMe` → `GET /auth/me`

Caches update on successful save; `clearAllSettingsCaches()` runs on sign-out (with `clearPceCache()`).

# Phase 50 — UI Language (English / Korean)

**Performed:** 2026-09-08  
**Status:** Finished

## Goal

Add English/Korean UI language selection in Settings / Environment (localStorage, default English, mirroring Theme). Introduce `LocaleProvider` and message catalogs; translate authenticated app UI plus login/register.

## Outcomes

- `apps/web/src/lib/locale.ts` — `Locale`, `johel-locale` storage, bootstrap script for `document.documentElement.lang`
- `LocaleProvider` with `useLocale()`, `useT()`, `useTLines()`; wired in root layout (`ThemeProvider` → `LocaleProvider` → `ToastProvider`)
- Message catalogs `messages/en.ts`, `messages/ko.ts`, `translate.ts` with English fallback and `{param}` interpolation
- Settings / Environment **Language** section (English / Korean toggles, instant apply)
- UI copy migrated across shell, auth, CRUD, Generate, Prompts, Quick Experience, AI Usage History, toasts, validation, field guidance
- Unit tests in `apps/web/src/lib/__tests__/locale.test.ts`

## Out of scope

- User-generated content, AI outputs, prompt default templates
- API error strings from server (shown as-is)
- Workflow resume **output language** (per-workflow `en` / `ja` / `zh-TW` / `zh-CN` / `ko` — separate from UI locale)

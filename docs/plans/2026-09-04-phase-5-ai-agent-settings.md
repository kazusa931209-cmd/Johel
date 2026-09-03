# Phase 5 — AI Agent Settings (web + API)

**Performed:** 2026-09-04  
**Status:** Finished

## Goal

Let each signed-in user save an AI provider and API key from Settings. Theme stays. Stored key is never shown in full.

## Storage

- One `Setting` per user: `provider` (`cursor`), plaintext `apiKey`
- GET returns `{ provider, apiKeyMasked }` only (e.g. `4F28 ******** 3429`)

## API

- `GET /settings`, `PUT /settings` (JWT cookie)

## Web

- Settings: Theme + AI Agent (Cursor AI Agent, API key input, Save)

## Out of scope

- Calling Cursor
- Hashing or encrypting the key
- Other providers

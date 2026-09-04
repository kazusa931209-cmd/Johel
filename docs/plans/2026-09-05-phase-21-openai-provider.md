# Phase 21 — Add OpenAI Provider

**Performed:** 2026-09-05  
**Status:** Finished

## Goal

Add OpenAI as a selectable AI Agent provider alongside Cursor. Use GPT-5.6 Luna for AI Verdict and GPT-5.6 Terra for resume generation. Keep one active provider + one API key per user in Settings.

## Delivered

- Shared `AiProviderId` (`cursor` | `openai`) in `apps/api/src/lib/ai-provider.ts`
- `PUT /settings` accepts `cursor` or `openai`
- OpenAI Responses adapters under `apps/api/src/lib/openai/` and provider files in `ai-verdict/` and `ai-resume/`
- Settings provider dropdown enabled; masked key shown only when selected provider matches saved provider
- Inline validation on Save (required asterisks; Save stays enabled); toast on API result

## Models

| Call | Model | Reasoning effort |
| --- | --- | --- |
| AI Verdict | `gpt-5.6-luna` | `low` |
| AI Resume | `gpt-5.6-terra` | `medium` |

## Out of scope

- Anthropic or other providers
- Per-provider stored keys / model picker in Settings
- Encrypting API keys
- Changing Cursor adapter behavior

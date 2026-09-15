# AI Assistant — Check the Gaps

**Date:** 2026-09-16

## Summary

Replace header global search with **AI Assistant** — categorized assistance panel (⌘K / Ctrl+K). First category: **Check the Gaps**.

## Delivered

- `AiAssistantProvider` / `AiAssistantTrigger` / dialog with **Check the Gaps** category chip
- `TextSelectionToolbar` on Generate Evaluate step — **Ask** disabled, **Check** opens AI Assistant prefilled with selection + current `generationId`
- `POST /ai-check-gaps` — embedding-ranked experience pool, optional Combine linkage, structured verdict, Markdown response
- i18n (`nav.header.aiAssistant.*`, `aiAssistant.checkGaps.*`, evaluate selection labels)
- Docs: `specification.md`, `technology.md`

## Out of scope

- Free AI chat
- Enabled **Ask** on selection toolbar
- Additional categories
- Settings-editable Check the Gaps prompt

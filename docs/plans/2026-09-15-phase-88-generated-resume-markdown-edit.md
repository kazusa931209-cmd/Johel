# Phase 88 — Generated resume Markdown edit

**Performed:** 2026-09-15  
**Status:** Finished

## Goal

Let users review and edit the AI-generated resume as Markdown on the Generate step. Canonical storage remains `GeneratedResume` JSON; Markdown is the edit surface only.

## Delivered

- `@johel/resume` — `markdownToResume` inverse parser with round-trip Vitest tests
- `EditableResumePanel` — Edit / Preview toggle, debounced parse, inline validation, Revert to AI version
- Session — `resumeAiSnapshot`, `updateResume`, `resumeHash` in `buildEvaluationInputKey`
- `GeneratePanelHeaderActions` — renamed from `GeneratePanelCopyActions` (Copy + trailing header controls)
- Generate step panel header — Copy, Edit / Preview, Revert
- Evaluate left panel — read-only resume preview (unchanged)
- i18n — `generate.generateStep.editMode`, `previewMode`, `editHint`, `parseError`, `revertToAi`, `revertToAiSuccess`

## Out of scope

- WYSIWYG editor
- History drawer editing
- Evaluate-step resume editing

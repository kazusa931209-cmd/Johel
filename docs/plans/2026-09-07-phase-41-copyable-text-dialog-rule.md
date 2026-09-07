# Phase 41 — Copyable Text & Dialog Rule

## Outcomes

- AI Usage Detail: **Input** / **Output** tabs (Input default); Markdown preview via `AiVerdictMarkdown`; Copy copies raw stored text for the active tab + toast
- `DetailDialog` `mode="view" | "form"` derives backdrop dismiss behavior
- Add/Edit dialogs use `mode="form"`; view-only and delete confirms use default `mode="view"`
- `WorkflowCompanyDialog` refactored to `DetailDialog`
- Cursor rule: `.cursor/rules/dialog-dismiss.mdc`

## Technical

- `CopyButton` + `copyTextToClipboard` helper in `apps/web/src/lib/copy-to-clipboard.ts`
- `mode="form"` → `dismissOnBackdrop=false`; `mode="view"` → `dismissOnBackdrop=true`
- Detail drawer tab panel resets to Input when `detail.id` changes

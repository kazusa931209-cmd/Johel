# Phase 38 — Auto markdown format on save

## Goal

When the user saves **Verdict Prompt**, **Generate Prompt**, **Evaluate Prompt**, **Company Description**, or **Experience Description**, the server converts that field to markdown with the user's AI Agent and stores the converted text. If a field is unchanged since last save (trimmed equality with the stored value), skip the AI call and persist as-is.

## Behavior

- Editors stay as textareas (markdown source). After a successful Prompts save, the textareas refresh with the converted markdown. Company / Experience still redirect to the list; the next edit and the detail dialog show the stored markdown.
- Each affected field shows a muted hint: **Contents will be automatically converted to markdown format when you save.**
- Save stays enabled; required-field validation stays inline.
- If any field needs conversion and Settings has no provider/API key, Save fails with a toast (do not persist unformatted text).
- If conversion is needed, show a fullscreen overlay while Save runs.
- Toast on API success or failure. Refresh header **Token Used** after Save.
- Company / Experience **detail dialogs** render Description with `AiVerdictMarkdown`. List tables stay plain-text snippets.

## Implementation

- `apps/api/src/lib/ai-markdown-format/` — AI conversion module; `formatMarkdownOnSave` helper
- `generateType: "markdownFormat"` in `recordAiUsage`
- Wired into `PUT /prompts`, `POST/PUT /companies`, `POST/PUT /experiences`
- Web: save hints, `BusyOverlay`, token refresh, markdown in detail dialogs

## Documentation

- Updated `docs/specification.md` and `docs/technology.md`

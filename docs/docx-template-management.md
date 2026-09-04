# DOCX Template Management

Technical reference for how JoHEL turns canonical resume JSON into downloadable `.docx` files, how templates are structured today, and how template management is expected to grow.

Product requirements and feature scope live in [`specification.md`](./specification.md). Broader stack notes live in [`technology.md`](./technology.md).

## Purpose

JoHEL generates résumés as structured JSON (`GeneratedResume`) during the Generate flow. Users review the result as Markdown in the browser and download a Word document from the same JSON — **without calling the AI again**.

DOCX output is produced **server-side** on the API using the [`docx`](https://www.npmjs.com/package/docx) library inside the workspace package `@johel/resume`.

The product specification also requires that users eventually be able to **configure templates and formats using natural language**. That user-facing template management is **not implemented yet**. This document describes the current code-based template system and the intended extension path.

## End-to-end flow

```text
Generate step (web)
    → POST /resume/docx  { resume: GeneratedResume }
        → validate with Zod (generatedResumeSchema)
        → buildResumeDocxBuffer(resume)   [@johel/resume/docx]
            → default template assembles section Paragraph[]
            → Packer.toBuffer(Document)
        → attachment: {name}.docx
```

| Step | Location | Notes |
| --- | --- | --- |
| Session storage | `apps/web/src/lib/generate-session.ts` | Resume JSON persisted per user until Job/PCEW inputs change |
| Preview | `apps/web/src/components/generate/GenerateGenerateStep.tsx` | `resumeToMarkdown(resume)` for on-screen Markdown |
| Download trigger | `apps/web/src/lib/api.ts` → `downloadResumeDocx` | `POST /backend/resume/docx` with stored JSON |
| API route | `apps/api/src/routes/resume.ts` | Auth required; validates JSON; returns binary attachment |
| Builder | `packages/resume/src/docx-builder/` | Canonical implementation (exported as `@johel/resume/docx`) |

The download filename is derived from `resume.header.name` (sanitized to lowercase alphanumeric segments, default `resume.docx`).

## Canonical data model

All templates consume the same input: **`GeneratedResume`** (Zod schema in `packages/resume/src/domain/generated-resume.ts`).

| Section | JSON path | Required | DOCX section builder |
| --- | --- | --- | --- |
| Header | `header.name`, `header.title?`, `header.contact?` | `name` required | `buildHeaderSection` |
| Summary | `summary?` | No | `buildSummarySection` (skipped when empty) |
| Skills | `skills[]` with `category` + `items[]` | No | `buildSkillsSection` (skipped when empty) |
| Experience | `experiences[]` with `company`, `title`, `bullets[]` | At least one | `buildExperienceSection` |
| Education | `education[]` | No | `buildEducationSection` (skipped when empty) |
| Certifications | `certifications[]` | No | `buildCertificationsSection` (skipped when empty) |
| Projects | `projects[]` | No | `buildProjectsSection` (skipped when empty) |

`POST /resume/docx` rejects resumes that fail schema validation or `isNonEmptyResume` (requires non-empty `header.name` and at least one experience).

Markdown preview (`resumeToMarkdown`) uses the **same section order and field mapping** as the default DOCX template so web display and download stay aligned.

## Template architecture

Templates are **TypeScript modules**, not uploaded `.docx` files. A template is a function that maps `GeneratedResume` + `ResumeDocxStyle` → `docx` `Paragraph[]`.

```text
packages/resume/src/docx-builder/
├── builder.ts              # Document + Packer entry points
├── styles.ts               # ResumeDocxStyle tokens + DEFAULT_RESUME_DOCX_STYLE
├── templates/
│   └── default.ts          # Section order and composition
└── sections/
    ├── header.ts
    ├── summary.ts
    ├── skills.ts
    ├── experience.ts
    ├── education.ts
    ├── certifications.ts
    └── projects.ts
```

### Public API (`@johel/resume/docx`)

| Export | Role |
| --- | --- |
| `buildResumeDocxBuffer(resume, style?)` | Node/API — returns `Buffer` |
| `buildResumeDocxBlob(resume, style?)` | Browser-capable — returns `Blob` |
| `buildDefaultResumeDocxChildren(resume, style?)` | Low-level paragraph list for custom documents |
| `DEFAULT_RESUME_DOCX_STYLE` | Default style token object |
| `ResumeDocxStyle` | Type for style overrides |

`builder.ts` always uses `buildDefaultResumeDocxChildren` today. Passing a custom `ResumeDocxStyle` is supported at the API level but **not exposed** to end users or the HTTP route yet.

### Default template

`templates/default.ts` defines section order:

1. Header (centered name, optional title, contact line)
2. Summary
3. Skills
4. Experience
5. Education
6. Certifications
7. Projects

Optional sections are omitted entirely when their source arrays/strings are empty — no placeholder headings.

### Layout conventions (default template)

| Element | Layout |
| --- | --- |
| Name | Centered, bold, `headingSize` |
| Title | Centered, regular weight |
| Contact | Centered, pipe-separated (`email \| phone \| location \| …`) |
| Section headings | Left-aligned, bold, `sectionHeadingSize` |
| Experience entry | `Title — Company` (bold); date range and location on next line (italic); bulleted achievements |
| Skills | `Category: item1, item2, …` per group |
| Education | Institution (bold); degree/field; date range (italic) |
| Certifications / project bullets | Level-0 bullet list |

Font sizes use **half-points** as required by the `docx` library (e.g. `22` → 11 pt body text).

## Style tokens (`ResumeDocxStyle`)

Defined in `packages/resume/src/docx-builder/styles.ts`.

| Token | Default | Meaning |
| --- | --- | --- |
| `fontFamily` | `"Calibri"` | TextRun font |
| `fontSize` | `22` | Body text (11 pt) |
| `headingSize` | `32` | Header name (16 pt) |
| `sectionHeadingSize` | `26` | Section titles (13 pt) |
| `paragraphSpacing` | `120` | Spacing after paragraphs (twips) |
| `sectionSpacing` | `240` | Spacing before section headings |
| `lineSpacing` | `276` | Line spacing on multi-line / bullet blocks |

All section builders accept `style: ResumeDocxStyle` so a future template or theme can override tokens without duplicating layout logic.

## Adding or changing templates (developer)

There is **no template registry or database** yet. To add a new layout:

1. **Reuse section builders** — Prefer composing existing `build*Section` functions with a different order or subset.
2. **Add a template module** — e.g. `templates/compact.ts` exporting `buildCompactResumeDocxChildren(resume, style)`.
3. **Wire the builder** — Extend `builder.ts` (or add a `templateId` parameter) to select the template function before `Packer.toBuffer`.
4. **Expose selection** — When product adds user-facing template choice, pass the selected template id from API → builder (see Future work).
5. **Test** — Add a Vitest case under `docx-builder/__tests__/` asserting non-empty buffer and ZIP magic bytes (`PK`).

To change typography globally, edit `DEFAULT_RESUME_DOCX_STYLE` or pass overrides into `buildResumeDocxBuffer(resume, customStyle)`.

To change a single section’s structure, edit the matching file under `sections/`; keep `resumeToMarkdown` in sync if preview parity matters.

## Future work: user-facing template management

Aligned with [`specification.md`](./specification.md) (“configure the templates and formats used by the main features using natural language”), a future phase would likely add:

| Concern | Direction (not implemented) |
| --- | --- |
| Storage | Per-user template settings in SQLite (name, natural-language rules, optional style overrides) |
| Selection | Choose template on Generate or per Workflow |
| Natural language | LLM-assisted mapping from user instructions → `ResumeDocxStyle` deltas and/or section order flags |
| Safety | Constrain LLM output to allowed style keys and enumerated layout options; never execute arbitrary code |
| Preview | Optional DOCX preview or PDF sidecar; today only Markdown preview exists |

Until that phase ships, **one built-in default template** is always used for download.

## Testing

| Test | Location | What it checks |
| --- | --- | --- |
| DOCX buffer | `packages/resume/src/docx-builder/__tests__/builder.test.ts` | Non-empty buffer, ZIP header |
| Schema | `packages/resume/src/domain/__tests__/generated-resume.test.ts` | `GeneratedResume` validation |
| Markdown parity | `packages/resume/src/markdown/__tests__/resume-to-markdown.test.ts` | Deterministic Markdown from JSON |

Run: `pnpm --filter @johel/resume test`

## Related files

| File | Role |
| --- | --- |
| `packages/resume/src/domain/generated-resume.ts` | Schema + parse helpers |
| `packages/resume/src/docx-builder/` | DOCX template system |
| `packages/resume/src/markdown/resume-to-markdown.ts` | Web preview |
| `apps/api/src/routes/resume.ts` | `POST /resume/docx` |
| `apps/web/src/lib/api.ts` | `downloadResumeDocx` client |
| `apps/web/src/components/generate/GenerateGenerateStep.tsx` | Download button + toast |

## Operational notes

- DOCX generation is **deterministic** and **local** — no external SaaS or paid render service.
- Failures return HTTP 500 with `{ error: "DOCX generation failed." }`; the web UI shows an error toast.
- PDF export is listed in the product spec but **not implemented**; DOCX is the only export format today.

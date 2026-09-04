# Phase 8 — Workspace Profiles

## Phase definition (product)

Add to [docs/specification.md](../specification.md):

- **Phase 8 — Workspace profiles** — Workspace includes **Profiles** (above Workflows). Per-user profiles list with search, pagination, add, edit, delete. Add/edit use dedicated pages; Links work like workflow Metadata (local until Save).

Grow UI:

- Sidebar order: **Profiles** → **Workflows** → **Generate**
- List columns: No, Full Name (`First Name` + `Last Name`), Birth date, Email, PN, Links, Residence, Education; Edit/Delete icon actions
- Search + Add (plus icon) like Workflows; 10 rows per page
- Editor: first/last name, birth date, email, PN, residence, education, Links table (Key required, Value/link optional); back beside title; Cancel/Save for whole profile
- Required fields (default for this phase): **First Name**, **Last Name**; other scalar fields optional; Link **Key** required when adding a link row
- Header menu **Profile** (`/profile`) stays the account email page — distinct from Workspace **Profiles**

## Data model / API

Prisma (camelCase tables via `@@map`):

```prisma
model Profile {
  id, userId, firstName, lastName, birthDate?, email?, pn?,
  residence?, education?, createdAt, updatedAt
  links ProfileLink[]
  @@map("profiles")
}

model ProfileLink {
  id, profileId, key, link?, sortOrder, createdAt, updatedAt
  @@unique([profileId, key])
  @@map("profileLinks")
}
```

- `birthDate` stored as date-only string `YYYY-MM-DD` (SQLite-friendly, matches date input)
- Per-user ownership (`userId`); cascade delete links with profile
- On POST/PUT: replace all `profileLinks` (deleteMany + createMany), same as workflow metadata

Routes (mirror workflows):

- `GET /profiles?q=&page=` — lean list; include `links` for the Links column
- `GET /profiles/:id` — full detail
- `POST /profiles` / `PUT /profiles/:id` — `{ firstName, lastName, birthDate?, email?, pn?, residence?, education?, links: [{ key, link? }] }`
- `DELETE /profiles/:id`
- Search `q` across firstName, lastName, email, pn, residence, education

## Web

- Sidebar: Profiles `/profiles` above Workflows
- List: `/profiles` — filter + AddButton, table, pagination, delete confirm
- Editor: `/profiles/new`, `/profiles/[id]/edit` + shared `ProfileForm` / `ProfileLinksEditor`
- Links UX mirrors workflow Metadata

## Docs / close-out

1. Spec Phase 8 + Profiles UX; mark `[x]` when done
2. `docs/technology.md`: `profiles` / `profileLinks`, endpoints, routes
3. Archive plan as `docs/plans/YYYY-MM-DD-phase-8-workspace-profiles.md`
4. Smoke-test list/create/get/update/delete + web build

## Out of scope

- Wiring profiles into Generate / resume generation
- Changing header **Profile** account page

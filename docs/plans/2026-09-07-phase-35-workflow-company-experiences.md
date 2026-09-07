# Phase 35 — Workflow company–experience mapping

Replace flat Companies + Experiences pickers in the workflow editor with ordered company entries, each with required employment period (`startDate`, `endDate`) and explicitly linked experiences via an Add/Edit dialog.

## Outcomes

- Prisma: `workflowCompanyExperiences` junction; required `startDate`/`endDate` on `workflowCompanies`; dropped `workflowExperiences`
- `POST/PUT /workflows` payload: `{ name, description?, language, profileId, companies: [{ companyId, startDate, endDate, experienceIds[] }] }`
- `GET /workflows/:id` returns ordered `companies[]` with nested `experienceIds[]`
- Resume generation input nests experiences under companies with period fields
- Web: `WorkflowProfilePicker`, `WorkflowCompaniesEditor`, `WorkflowCompanyDialog`; workflow detail dialog shows grouped companies with period and experiences

## Migration note

Existing workflows lose flat `workflowExperiences` rows and prior `workflowCompanies` rows (no auto-mapping). Users re-add company entries with period and linked experiences in the editor.

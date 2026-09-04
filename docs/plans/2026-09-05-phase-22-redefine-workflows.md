# Phase 22 — Redefine workflows as PCEW presets

Workflows bundle one profile, one or more companies, one or more experiences, and resume output language. Remove `workflowMetadata`. Generate middle step is **Workflow** (workflow-only selection). Workflow editor uses shared PCEW pickers.

## Outcomes

- Prisma: `workflows.profileId`, `workflowCompanies`, `workflowExperiences`; dropped `workflowMetadata`
- `POST/PUT /workflows` payload: `{ name, description?, language, profileId, companyIds[], experienceIds[] }`
- `POST /ai-resume` body: `{ jobDescription, acceptedMarkdown, workflowId }` only
- Web: `WorkflowPcewPicker`, `GenerateWorkflowStep`; session `workflow: { workflowId }`; timeline Job → Workflow → Generate
- Generate prerequisites: Workflow + Verdict only

## Migration note

Existing workflows lose metadata rows; `profileId` and junction rows are empty until users re-edit workflows in the editor.

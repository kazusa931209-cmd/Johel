import type { AiProviderId } from "../ai-provider.js";
import type { AuthorAdviseGraph, AuthorAdviseRequest } from "./types.js";

const JSON_SCHEMA = `{
  "placement": "create_experience | update_experience | link_existing | update_company | update_role_context | update_workflow_description | need_more_facts",
  "rationale": "string (required)",
  "questions": ["string"],
  "target": {
    "workflowId": "string | null",
    "experienceId": "string | null",
    "companyId": "string | null"
  },
  "draft": {
    "category": "string | null",
    "problem": "string | null",
    "actions": "string | null",
    "outcome": "string | null",
    "whatCompanyIs": "string | null",
    "domainAndStack": "string | null",
    "roleContext": "string | null",
    "workflowDescription": "string | null"
  },
  "link": {
    "workflowId": "string | null",
    "companyId": "string | null",
    "experienceId": "string | null"
  },
  "warnings": ["string"]
}`;

const SHARED_RULES = `You are an AI authoring advisor for JoHEL, a resume workspace tool.

Your job: given the user's workspace graph and what they actually did, recommend where to record those facts (Company scene, Experience STAR card, Workflow link, role context, or workflow description).

Authoring rules (must follow):
- Company fields (whatCompanyIs, domainAndStack) hold employer scene only: industry, product, customer, domain, stack, scale snapshots. Never put personal achievements or "I built…" metrics on Company.
- Experience holds one capability unit (STAR): category, problem, actions, outcome. One card = one capability. Do not put JD routing instructions in Actions ("use when the JD asks for X").
- Workflow description is persona/emphasis for that preset, not a metrics dump.
- Linking a card to a company asserts that work happened there. Do not link company-specific work to a shared card used at another employer unless the STAR facts are true in both scenes.
- Do not link two stack variants of the same capability to the same company entry in one workflow.
- Do not invent employers, tools, dates, or metrics the user did not state.
- If facts are insufficient, use placement need_more_facts with questions and empty draft/link.

Placement guide:
- create_experience: new STAR card; set link.workflowId + link.companyId when the work belongs at a specific employer in a workflow.
- update_experience: append or refine an existing linked card (target.experienceId).
- rationale must name the exact target using graph labels (workflow name, company name, experience category)—not only ids. For update_experience, state which experience card and which workflow/employer link the edit applies to.
- link_existing: card exists in the graph but is not linked on the target company entry (target/link workflowId + companyId + experienceId).
- update_company: scene wording only (target.companyId).
- update_role_context: workflow company entry role hint (target.workflowId + target.companyId).
- update_workflow_description: workflow persona (target.workflowId).

When the graph scope is all workflows, you MUST set target.workflowId or link.workflowId for any workflow-scoped placement (link, role context, description, create-and-link).

Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA}`;

export function getAuthorAdviseSystemPrompt(provider: AiProviderId): string {
  const notes =
    provider === "cursor"
      ? "Provider notes (Cursor AI Agent): Return ONLY valid JSON."
      : "Provider notes (OpenAI): Return ONLY valid JSON. Do NOT wrap the answer in a code fence.";
  return `${SHARED_RULES}\n\n${notes}`;
}

function formatProfileSection(
  profile: AuthorAdviseGraph["workflows"][number]["profile"],
): string {
  if (!profile) {
    return "## Profile\n\n(not selected)";
  }
  const lines = [
    `- Name: ${profile.firstName} ${profile.lastName}`.trim(),
    profile.email ? `- Email: ${profile.email}` : null,
    profile.pn ? `- Phone: ${profile.pn}` : null,
    profile.residence ? `- Residence: ${profile.residence}` : null,
  ].filter((line): line is string => Boolean(line));
  return `## Profile\n\n${lines.join("\n")}`;
}

function formatCompaniesSection(
  companies: AuthorAdviseGraph["workflows"][number]["companies"],
): string {
  if (companies.length === 0) {
    return "## Companies (résumé order)\n\n(none)";
  }

  const blocks = companies.map((company, index) => {
    const experienceBlocks = company.experiences.map((experience) => {
      return [
        `#### ${experience.category} (id: ${experience.id})`,
        `Problem:\n${experience.problem.trim()}`,
        `Actions:\n${experience.actions.trim()}`,
        `Outcome:\n${experience.outcome.trim()}`,
      ].join("\n\n");
    });

    return [
      `### ${index + 1}. ${company.name} (companyId: ${company.id}, ${company.startDate} – ${company.endDate})`,
      `Role context: ${company.roleContext.trim()}`,
      `What this company is:\n${company.whatCompanyIs.trim()}`,
      `Domain & stack:\n${company.domainAndStack.trim()}`,
      experienceBlocks.length > 0
        ? `Linked experiences:\n\n${experienceBlocks.join("\n\n")}`
        : "Linked experiences: (none)",
    ].join("\n\n");
  });

  return `## Companies (résumé order)\n\n${blocks.join("\n\n")}`;
}

function formatWorkflowBlock(
  item: AuthorAdviseGraph["workflows"][number],
): string {
  const description = item.workflow.description.trim();
  const intent = [
    `### Workflow: ${item.workflow.name} (workflowId: ${item.workflow.id})`,
    `- Language: ${item.workflow.language}`,
    description
      ? `Description:\n${description}`
      : "Description: (none)",
  ].join("\n");

  return [intent, formatProfileSection(item.profile), formatCompaniesSection(item.companies)].join(
    "\n\n",
  );
}

export function buildAuthorAdviseUserPrompt(input: AuthorAdviseRequest): string {
  const scopeLine =
    input.graph.scope === "one"
      ? "Graph scope: **one workflow** (only the workflow below)."
      : "Graph scope: **all workflows** (every workflow below). When linking or updating workflow-scoped fields, name the workflowId.";

  const workflowBlocks = input.graph.workflows.length
    ? input.graph.workflows.map((item) => formatWorkflowBlock(item)).join("\n\n---\n\n")
    : "(no workflows)";

  return [
    "Advise where to record the user's facts in the workspace graph.",
    scopeLine,
    "",
    workflowBlocks,
    "",
    "## User facts",
    "",
    input.userFacts.trim(),
  ].join("\n");
}

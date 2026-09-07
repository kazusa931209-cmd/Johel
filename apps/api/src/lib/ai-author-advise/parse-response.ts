import { z } from "zod";
import type { AuthorAdvisePlacement, AuthorAdviseProposal } from "./types.js";

const placementSchema = z.enum([
  "create_experience",
  "update_experience",
  "link_existing",
  "update_company",
  "update_role_context",
  "update_workflow_description",
  "need_more_facts",
]);

const nullableString = z.union([z.string(), z.null()]).optional();

const draftSchema = z.object({
  category: nullableString,
  problem: nullableString,
  actions: nullableString,
  outcome: nullableString,
  whatCompanyIs: nullableString,
  domainAndStack: nullableString,
  roleContext: nullableString,
  workflowDescription: nullableString,
});

const targetSchema = z.object({
  workflowId: nullableString,
  experienceId: nullableString,
  companyId: nullableString,
});

const linkSchema = z.object({
  workflowId: nullableString,
  companyId: nullableString,
  experienceId: nullableString,
});

const responseSchema = z.object({
  placement: placementSchema,
  rationale: z.string().trim().min(1),
  questions: z.array(z.string()).default([]),
  target: targetSchema.default({
    workflowId: null,
    experienceId: null,
    companyId: null,
  }),
  draft: draftSchema.default({
    category: null,
    problem: null,
    actions: null,
    outcome: null,
    whatCompanyIs: null,
    domainAndStack: null,
    roleContext: null,
    workflowDescription: null,
  }),
  link: linkSchema.default({
    workflowId: null,
    companyId: null,
    experienceId: null,
  }),
  warnings: z.array(z.string()).default([]),
});

function normalizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDraft(
  draft: z.infer<typeof draftSchema>,
): AuthorAdviseProposal["draft"] {
  return {
    category: normalizeNullable(draft.category ?? null),
    problem: normalizeNullable(draft.problem ?? null),
    actions: normalizeNullable(draft.actions ?? null),
    outcome: normalizeNullable(draft.outcome ?? null),
    whatCompanyIs: normalizeNullable(draft.whatCompanyIs ?? null),
    domainAndStack: normalizeNullable(draft.domainAndStack ?? null),
    roleContext: normalizeNullable(draft.roleContext ?? null),
    workflowDescription: normalizeNullable(draft.workflowDescription ?? null),
  };
}

function normalizeTarget(
  target: z.infer<typeof targetSchema>,
): AuthorAdviseProposal["target"] {
  return {
    workflowId: normalizeNullable(target.workflowId ?? null),
    experienceId: normalizeNullable(target.experienceId ?? null),
    companyId: normalizeNullable(target.companyId ?? null),
  };
}

function normalizeLink(
  link: z.infer<typeof linkSchema>,
): AuthorAdviseProposal["link"] {
  return {
    workflowId: normalizeNullable(link.workflowId ?? null),
    companyId: normalizeNullable(link.companyId ?? null),
    experienceId: normalizeNullable(link.experienceId ?? null),
  };
}

const WORKFLOW_SCOPED_PLACEMENTS: AuthorAdvisePlacement[] = [
  "link_existing",
  "update_role_context",
  "update_workflow_description",
];

export function validateAuthorAdviseProposalShape(
  proposal: AuthorAdviseProposal,
  graphScope: "one" | "all",
): string | null {
  if (proposal.placement === "need_more_facts") {
    if (proposal.questions.length < 1) {
      return "need_more_facts requires at least one question.";
    }
    return null;
  }

  if (graphScope === "all" && WORKFLOW_SCOPED_PLACEMENTS.includes(proposal.placement)) {
    if (!proposal.target.workflowId) {
      return `${proposal.placement} requires target.workflowId when advising across all workflows.`;
    }
  }

  if (proposal.placement === "create_experience") {
    const draft = proposal.draft;
    if (!draft.category || !draft.problem || !draft.actions || !draft.outcome) {
      return "create_experience requires draft category, problem, actions, and outcome.";
    }
    const linkWf = proposal.link.workflowId ?? proposal.target.workflowId;
    const linkCo = proposal.link.companyId ?? proposal.target.companyId;
    if (linkWf && !linkCo) {
      return "create_experience with a workflow link requires link.companyId.";
    }
  }

  if (proposal.placement === "update_experience" && !proposal.target.experienceId) {
    return "update_experience requires target.experienceId.";
  }

  if (proposal.placement === "link_existing") {
    if (
      !proposal.target.workflowId ||
      !proposal.target.companyId ||
      !(proposal.link.experienceId ?? proposal.target.experienceId)
    ) {
      return "link_existing requires target.workflowId, target.companyId, and an experience id.";
    }
  }

  if (proposal.placement === "update_company" && !proposal.target.companyId) {
    return "update_company requires target.companyId.";
  }

  if (proposal.placement === "update_role_context") {
    if (!proposal.target.workflowId || !proposal.target.companyId) {
      return "update_role_context requires target.workflowId and target.companyId.";
    }
    if (!proposal.draft.roleContext) {
      return "update_role_context requires draft.roleContext.";
    }
  }

  if (proposal.placement === "update_workflow_description") {
    if (!proposal.target.workflowId) {
      return "update_workflow_description requires target.workflowId.";
    }
    if (!proposal.draft.workflowDescription) {
      return "update_workflow_description requires draft.workflowDescription.";
    }
  }

  return null;
}

export function parseAuthorAdviseResponse(
  raw: string,
  graphScope: "one" | "all",
): { success: true; proposal: AuthorAdviseProposal } | { success: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: "AI returned an empty response." };
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "AI response was not valid JSON." };
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      success: false,
      error: "AI response did not match the required authoring advisor schema.",
    };
  }

  const proposal: AuthorAdviseProposal = {
    placement: parsed.data.placement,
    rationale: parsed.data.rationale,
    questions: parsed.data.questions,
    target: normalizeTarget(parsed.data.target),
    draft: normalizeDraft(parsed.data.draft),
    link: normalizeLink(parsed.data.link),
    warnings: parsed.data.warnings,
  };

  const shapeError = validateAuthorAdviseProposalShape(proposal, graphScope);
  if (shapeError) {
    return { success: false, error: shapeError };
  }

  return { success: true, proposal };
}

import { formatMarkdownOnSave } from "../ai-markdown-format/format-on-save.js";
import { prisma } from "../prisma.js";
import { buildAuthorAdviseWorkspaceFingerprint } from "./fingerprint.js";
import { loadAuthorAdviseGraph } from "./load-graph.js";
import type {
  AuthorAdviseDraft,
  AuthorAdviseGraph,
  AuthorAdviseProposal,
} from "./types.js";

export type ApplyAuthorAdviseInput = {
  userId: string;
  drawerWorkflowId?: string;
  workspaceFingerprint: string;
  proposal: AuthorAdviseProposal;
  draftOverride?: Partial<AuthorAdviseDraft>;
};

export type ApplyAuthorAdviseResult = {
  appliedWorkflowId: string | null;
  warnings: string[];
};

function mergeDraft(
  proposal: AuthorAdviseProposal,
  override?: Partial<AuthorAdviseDraft>,
): AuthorAdviseDraft {
  const base = proposal.draft;
  if (!override) return base;
  return {
    category: override.category ?? base.category,
    problem: override.problem ?? base.problem,
    actions: override.actions ?? base.actions,
    outcome: override.outcome ?? base.outcome,
    whatCompanyIs: override.whatCompanyIs ?? base.whatCompanyIs,
    domainAndStack: override.domainAndStack ?? base.domainAndStack,
    roleContext: override.roleContext ?? base.roleContext,
    workflowDescription:
      override.workflowDescription ?? base.workflowDescription,
  };
}

function resolveWorkflowId(
  drawerWorkflowId: string | undefined,
  proposal: AuthorAdviseProposal,
): string | null {
  const fromTarget = proposal.target.workflowId;
  const fromLink = proposal.link.workflowId;
  const resolved = drawerWorkflowId ?? fromTarget ?? fromLink;

  if (
    drawerWorkflowId &&
    fromTarget &&
    drawerWorkflowId !== fromTarget
  ) {
    throw new Error(
      "Proposal workflow does not match the selected workflow in Quick PCE.",
    );
  }

  if (
    drawerWorkflowId &&
    fromLink &&
    drawerWorkflowId !== fromLink
  ) {
    throw new Error(
      "Proposal link workflow does not match the selected workflow in Quick PCE.",
    );
  }

  return resolved;
}

function collectGraphCompanyIds(graph: AuthorAdviseGraph): Set<string> {
  const ids = new Set<string>();
  for (const workflow of graph.workflows) {
    for (const company of workflow.companies) {
      ids.add(company.id);
    }
  }
  return ids;
}

function collectGraphExperienceIds(graph: AuthorAdviseGraph): Set<string> {
  const ids = new Set<string>();
  for (const workflow of graph.workflows) {
    for (const company of workflow.companies) {
      for (const experience of company.experiences) {
        ids.add(experience.id);
      }
    }
  }
  return ids;
}

function assertCompanyOnGraph(graph: AuthorAdviseGraph, companyId: string) {
  if (!collectGraphCompanyIds(graph).has(companyId)) {
    throw new Error("Company is not on the advise graph for this scope.");
  }
}

function assertExperienceOnGraph(graph: AuthorAdviseGraph, experienceId: string) {
  if (!collectGraphExperienceIds(graph).has(experienceId)) {
    throw new Error("Experience is not on the advise graph for this scope.");
  }
}

async function formatExperienceOutcomeOnSave(input: {
  userId: string;
  submitted: string;
  stored: string | null | undefined;
}): Promise<string> {
  const { formatted } = await formatMarkdownOnSave({
    userId: input.userId,
    kind: "experienceOutcome",
    submitted: input.submitted,
    stored: input.stored,
    maxLen: 20_000,
  });
  return formatted;
}

async function findWorkflowCompany(
  workflowId: string,
  companyId: string,
  userId: string,
) {
  const row = await prisma.workflowCompany.findFirst({
    where: {
      workflowId,
      companyId,
      workflow: { userId },
    },
    include: {
      experiences: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) {
    throw new Error("Workflow company entry was not found.");
  }
  return row;
}

export async function applyAuthorAdviseProposal(
  input: ApplyAuthorAdviseInput,
): Promise<ApplyAuthorAdviseResult> {
  const { proposal } = input;

  if (proposal.placement === "need_more_facts") {
    throw new Error("Cannot apply a need_more_facts proposal.");
  }

  const currentFingerprint = await buildAuthorAdviseWorkspaceFingerprint(
    input.userId,
    input.drawerWorkflowId,
  );
  if (currentFingerprint !== input.workspaceFingerprint) {
    throw new Error(
      "Workspace changed since the suggestion was created. Run Quick PCE again.",
    );
  }

  const graph = await loadAuthorAdviseGraph(
    input.userId,
    input.drawerWorkflowId,
  );
  const draft = mergeDraft(proposal, input.draftOverride);
  const warnings = [...proposal.warnings];
  let appliedWorkflowId: string | null = null;

  switch (proposal.placement) {
    case "create_experience": {
      if (!draft.category || !draft.problem || !draft.actions || !draft.outcome) {
        throw new Error(
          "create_experience requires category, problem, actions, and outcome.",
        );
      }

      const linkWorkflowId =
        proposal.link.workflowId ??
        proposal.target.workflowId ??
        input.drawerWorkflowId ??
        null;
      const linkCompanyId =
        proposal.link.companyId ?? proposal.target.companyId ?? null;

      const [{ formatted: problem }, { formatted: actions }, outcome] =
        await Promise.all([
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "experienceProblem",
            submitted: draft.problem,
            stored: "",
            maxLen: 20_000,
          }),
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "experienceActions",
            submitted: draft.actions,
            stored: "",
            maxLen: 20_000,
          }),
          formatExperienceOutcomeOnSave({
            userId: input.userId,
            submitted: draft.outcome,
            stored: "",
          }),
        ]);

      const experience = await prisma.experience.create({
        data: {
          userId: input.userId,
          category: draft.category,
          problem,
          actions,
          outcome,
        },
      });

      if (linkWorkflowId && linkCompanyId) {
        assertCompanyOnGraph(graph, linkCompanyId);
        const workflowCompany = await findWorkflowCompany(
          linkWorkflowId,
          linkCompanyId,
          input.userId,
        );
        const maxSort = workflowCompany.experiences.reduce(
          (max, item) => Math.max(max, item.sortOrder),
          -1,
        );
        await prisma.workflowCompanyExperience.create({
          data: {
            workflowCompanyId: workflowCompany.id,
            experienceId: experience.id,
            sortOrder: maxSort + 1,
          },
        });
        appliedWorkflowId = linkWorkflowId;
      }

      break;
    }

    case "update_experience": {
      const experienceId = proposal.target.experienceId;
      if (!experienceId) {
        throw new Error("update_experience requires target.experienceId.");
      }
      assertExperienceOnGraph(graph, experienceId);

      const existing = await prisma.experience.findFirst({
        where: { id: experienceId, userId: input.userId },
      });
      if (!existing) {
        throw new Error("Experience was not found.");
      }

      const category = draft.category ?? existing.category;
      const problemText = draft.problem ?? existing.problem;
      const actionsText = draft.actions ?? existing.actions;
      const outcomeText = draft.outcome ?? existing.outcome;

      const [{ formatted: problem }, { formatted: actions }, outcome] =
        await Promise.all([
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "experienceProblem",
            submitted: problemText,
            stored: existing.problem,
            maxLen: 20_000,
          }),
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "experienceActions",
            submitted: actionsText,
            stored: existing.actions,
            maxLen: 20_000,
          }),
          formatExperienceOutcomeOnSave({
            userId: input.userId,
            submitted: outcomeText,
            stored: existing.outcome,
          }),
        ]);

      await prisma.experience.update({
        where: { id: experienceId },
        data: { category, problem, actions, outcome },
      });

      const linkCount = await prisma.workflowCompanyExperience.count({
        where: { experienceId },
      });
      if (linkCount > 1) {
        warnings.push(
          `This experience is linked in ${linkCount} workflow company entries. Updates apply everywhere it is linked.`,
        );
      }

      break;
    }

    case "link_existing": {
      const workflowId = resolveWorkflowId(
        input.drawerWorkflowId,
        proposal,
      );
      const companyId = proposal.target.companyId;
      const experienceId =
        proposal.link.experienceId ?? proposal.target.experienceId;

      if (!workflowId || !companyId || !experienceId) {
        throw new Error(
          "link_existing requires workflowId, companyId, and experienceId.",
        );
      }

      assertCompanyOnGraph(graph, companyId);
      assertExperienceOnGraph(graph, experienceId);

      const owned = await prisma.experience.findFirst({
        where: { id: experienceId, userId: input.userId },
      });
      if (!owned) {
        throw new Error("Experience was not found.");
      }

      const workflowCompany = await findWorkflowCompany(
        workflowId,
        companyId,
        input.userId,
      );

      const alreadyLinked = workflowCompany.experiences.some(
        (item) => item.experienceId === experienceId,
      );
      if (alreadyLinked) {
        throw new Error("Experience is already linked on this company entry.");
      }

      const maxSort = workflowCompany.experiences.reduce(
        (max, item) => Math.max(max, item.sortOrder),
        -1,
      );

      await prisma.workflowCompanyExperience.create({
        data: {
          workflowCompanyId: workflowCompany.id,
          experienceId,
          sortOrder: maxSort + 1,
        },
      });

      appliedWorkflowId = workflowId;
      break;
    }

    case "update_company": {
      const companyId = proposal.target.companyId;
      if (!companyId) {
        throw new Error("update_company requires target.companyId.");
      }
      assertCompanyOnGraph(graph, companyId);

      const existing = await prisma.company.findFirst({
        where: { id: companyId, userId: input.userId },
      });
      if (!existing) {
        throw new Error("Company was not found.");
      }

      const whatCompanyIsText =
        draft.whatCompanyIs ?? existing.whatCompanyIs;
      const domainAndStackText =
        draft.domainAndStack ?? existing.domainAndStack;

      const [{ formatted: whatCompanyIs }, { formatted: domainAndStack }] =
        await Promise.all([
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "companyWhatItIs",
            submitted: whatCompanyIsText,
            stored: existing.whatCompanyIs,
            maxLen: 20_000,
          }),
          formatMarkdownOnSave({
            userId: input.userId,
            kind: "companyDomainAndStack",
            submitted: domainAndStackText,
            stored: existing.domainAndStack,
            maxLen: 20_000,
          }),
        ]);

      await prisma.company.update({
        where: { id: companyId },
        data: { whatCompanyIs, domainAndStack },
      });

      break;
    }

    case "update_role_context": {
      const workflowId = resolveWorkflowId(
        input.drawerWorkflowId,
        proposal,
      );
      const companyId = proposal.target.companyId;
      if (!workflowId || !companyId || !draft.roleContext) {
        throw new Error(
          "update_role_context requires workflowId, companyId, and roleContext.",
        );
      }

      assertCompanyOnGraph(graph, companyId);
      const workflowCompany = await findWorkflowCompany(
        workflowId,
        companyId,
        input.userId,
      );

      await prisma.workflowCompany.update({
        where: { id: workflowCompany.id },
        data: { roleContext: draft.roleContext.trim() },
      });

      appliedWorkflowId = workflowId;
      break;
    }

    case "update_workflow_description": {
      const workflowId = resolveWorkflowId(
        input.drawerWorkflowId,
        proposal,
      );
      if (!workflowId || !draft.workflowDescription) {
        throw new Error(
          "update_workflow_description requires workflowId and workflowDescription.",
        );
      }

      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, userId: input.userId },
      });
      if (!workflow) {
        throw new Error("Workflow was not found.");
      }

      await prisma.workflow.update({
        where: { id: workflowId },
        data: { description: draft.workflowDescription.trim() },
      });

      appliedWorkflowId = workflowId;
      break;
    }

    default:
      throw new Error(`Unsupported placement: ${proposal.placement}`);
  }

  return { appliedWorkflowId, warnings };
}

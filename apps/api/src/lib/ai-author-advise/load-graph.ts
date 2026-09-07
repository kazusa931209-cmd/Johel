import { prisma } from "../prisma.js";
import { assembleResumeGenerationInput } from "../resume/assemble-input.js";
import type {
  AuthorAdviseGraph,
  AuthorAdviseWorkflowGraph,
} from "./types.js";

const workflowInclude = {
  profile: {
    include: {
      links: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  companies: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      company: true,
      experiences: {
        orderBy: { sortOrder: "asc" as const },
        include: { experience: true },
      },
    },
  },
};

function toProfile(
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    email: string | null;
    pn: string | null;
    residence: string | null;
    education: string | null;
    links: { key: string; link: string | null }[];
  } | null,
) {
  if (!profile) return null;
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: profile.birthDate,
    email: profile.email,
    pn: profile.pn,
    residence: profile.residence,
    education: profile.education,
    links: profile.links.map((link) => ({
      key: link.key,
      link: link.link,
    })),
  };
}

function workflowRowToGraph(
  row: Awaited<
    ReturnType<
      typeof prisma.workflow.findMany<{ include: typeof workflowInclude }>
    >
  >[number],
): AuthorAdviseWorkflowGraph {
  return {
    workflowId: row.id,
    workflow: {
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      language: row.language,
    },
    profile: toProfile(row.profile),
    companies: row.companies.map((entry) => ({
      id: entry.company.id,
      alias: entry.company.alias,
      name: entry.company.name,
      whatCompanyIs: entry.company.whatCompanyIs,
      domainAndStack: entry.company.domainAndStack,
      startDate: entry.startDate,
      endDate: entry.endDate,
      roleContext: entry.roleContext,
      experiences: entry.experiences.map((link) => ({
        id: link.experience.id,
        category: link.experience.category,
        problem: link.experience.problem,
        actions: link.experience.actions,
        outcome: link.experience.outcome,
      })),
    })),
  };
}

export async function loadAuthorAdviseGraph(
  userId: string,
  workflowId?: string,
): Promise<AuthorAdviseGraph> {
  if (workflowId) {
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new Error("Selected workflow was not found.");
    }

    const assembled = await assembleResumeGenerationInput({
      userId,
      workflowId,
      jobContext: "",
    });

    return {
      scope: "one",
      workflows: [
        {
          workflowId: assembled.workflow.id,
          workflow: assembled.workflow,
          profile: assembled.profile,
          companies: assembled.companies,
        },
      ],
    };
  }

  const rows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    include: workflowInclude,
  });

  return {
    scope: "all",
    workflows: rows.map((row) => workflowRowToGraph(row)),
  };
}

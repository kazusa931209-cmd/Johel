import { prisma } from "../prisma.js";
import type { ResumeGenerationInput } from "../ai-resume/types.js";

type AssembleGenerationInputParams = {
  userId: string;
  jobDescription: string;
  acceptedMarkdown: string;
  workflowId: string;
};

export async function assembleResumeGenerationInput(
  params: AssembleGenerationInputParams,
): Promise<ResumeGenerationInput> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: params.workflowId, userId: params.userId },
    include: {
      companies: { orderBy: { sortOrder: "asc" } },
      experiences: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!workflow) {
    throw new Error("Selected workflow was not found.");
  }
  if (!workflow.profileId) {
    throw new Error(
      "Selected workflow is incomplete. Edit the workflow and choose a profile.",
    );
  }

  const companyIds = workflow.companies.map((item) => item.companyId);
  const experienceIds = workflow.experiences.map((item) => item.experienceId);

  if (companyIds.length < 1) {
    throw new Error(
      "Selected workflow is incomplete. Edit the workflow and choose at least one company.",
    );
  }
  if (experienceIds.length < 1) {
    throw new Error(
      "Selected workflow is incomplete. Edit the workflow and choose at least one experience.",
    );
  }

  const profile = await prisma.profile.findFirst({
    where: { id: workflow.profileId, userId: params.userId },
    include: {
      links: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) {
    throw new Error("Selected profile was not found.");
  }

  const companies = await prisma.company.findMany({
    where: {
      userId: params.userId,
      id: { in: companyIds },
    },
    include: {
      metadata: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (companies.length !== companyIds.length) {
    throw new Error("One or more selected companies were not found.");
  }

  const experiences = await prisma.experience.findMany({
    where: {
      userId: params.userId,
      id: { in: experienceIds },
    },
    include: {
      metadata: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (experiences.length !== experienceIds.length) {
    throw new Error("One or more selected experiences were not found.");
  }

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const experienceById = new Map(
    experiences.map((experience) => [experience.id, experience]),
  );

  return {
    jobDescription: params.jobDescription,
    acceptedMarkdown: params.acceptedMarkdown,
    profile: {
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
    },
    companies: companyIds.map((id) => {
      const company = companyById.get(id);
      if (!company) {
        throw new Error("One or more selected companies were not found.");
      }
      return {
        id: company.id,
        name: company.name,
        description: company.description,
        priority: company.priority,
        metadata: company.metadata.map((item) => ({
          key: item.key,
          value: item.value,
        })),
      };
    }),
    experiences: experienceIds.map((id) => {
      const experience = experienceById.get(id);
      if (!experience) {
        throw new Error("One or more selected experiences were not found.");
      }
      return {
        id: experience.id,
        category: experience.category,
        description: experience.description,
        metadata: experience.metadata.map((item) => ({
          key: item.key,
          value: item.value,
        })),
      };
    }),
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      language: workflow.language,
    },
  };
}

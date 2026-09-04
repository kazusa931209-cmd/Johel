import { prisma } from "../prisma.js";
import type { ResumeGenerationInput } from "../ai-resume/types.js";

type AssembleGenerationInputParams = {
  userId: string;
  jobDescription: string;
  acceptedMarkdown: string;
  profileId: string;
  companyIds: string[];
  experienceIds: string[];
  workflowId: string;
};

export async function assembleResumeGenerationInput(
  params: AssembleGenerationInputParams,
): Promise<ResumeGenerationInput> {
  const profile = await prisma.profile.findFirst({
    where: { id: params.profileId, userId: params.userId },
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
      id: { in: params.companyIds },
    },
    include: {
      metadata: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (companies.length !== params.companyIds.length) {
    throw new Error("One or more selected companies were not found.");
  }

  const experiences = await prisma.experience.findMany({
    where: {
      userId: params.userId,
      id: { in: params.experienceIds },
    },
    include: {
      metadata: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (experiences.length !== params.experienceIds.length) {
    throw new Error("One or more selected experiences were not found.");
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: params.workflowId, userId: params.userId },
    include: {
      metadata: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!workflow) {
    throw new Error("Selected workflow was not found.");
  }

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
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.description,
      priority: company.priority,
      metadata: company.metadata.map((item) => ({
        key: item.key,
        value: item.value,
      })),
    })),
    experiences: experiences.map((experience) => ({
      id: experience.id,
      category: experience.category,
      description: experience.description,
      metadata: experience.metadata.map((item) => ({
        key: item.key,
        value: item.value,
      })),
    })),
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      language: workflow.language,
      metadata: workflow.metadata.map((item) => ({
        key: item.key,
        rulePrompt: item.rulePrompt,
      })),
    },
  };
}

import { prisma } from "../prisma.js";
import type { ResumeGenerationInput } from "../ai-resume/types.js";

type AssembleGenerationInputParams = {
  userId: string;
  jobDescription: string;
  workflowId: string;
};

export async function assembleResumeGenerationInput(
  params: AssembleGenerationInputParams,
): Promise<ResumeGenerationInput> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: params.workflowId, userId: params.userId },
    include: {
      companies: {
        orderBy: { sortOrder: "asc" },
        include: {
          experiences: { orderBy: { sortOrder: "asc" } },
        },
      },
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
  if (workflow.companies.length < 1) {
    throw new Error(
      "Selected workflow is incomplete. Edit the workflow and add at least one company entry.",
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

  const companyIds = workflow.companies.map((item) => item.companyId);
  const experienceIds = [
    ...new Set(
      workflow.companies.flatMap((item) =>
        item.experiences.map((experience) => experience.experienceId),
      ),
    ),
  ];

  const companies = await prisma.company.findMany({
    where: {
      userId: params.userId,
      id: { in: companyIds },
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
  });
  if (experiences.length !== experienceIds.length) {
    throw new Error("One or more selected experiences were not found.");
  }

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const experienceById = new Map(
    experiences.map((experience) => [experience.id, experience]),
  );

  const assembledCompanies = workflow.companies.map((entry) => {
    const company = companyById.get(entry.companyId);
    if (!company) {
      throw new Error("One or more selected companies were not found.");
    }
    if (entry.experiences.length < 1) {
      throw new Error(
        "Selected workflow is incomplete. Each company entry must include at least one experience.",
      );
    }

    return {
      id: company.id,
      name: company.name,
      description: company.description,
      startDate: entry.startDate,
      endDate: entry.endDate,
      experiences: entry.experiences.map((link) => {
        const experience = experienceById.get(link.experienceId);
        if (!experience) {
          throw new Error("One or more selected experiences were not found.");
        }
        return {
          id: experience.id,
          category: experience.category,
          description: experience.description,
        };
      }),
    };
  });

  return {
    jobDescription: params.jobDescription,
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
    companies: assembledCompanies,
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? "",
      language: workflow.language,
    },
  };
}

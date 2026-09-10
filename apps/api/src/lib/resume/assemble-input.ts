import { prisma } from "../prisma.js";
import type { ResumeGenerationInput } from "../ai-resume/types.js";

export type CombineCompanySnapshot = {
  companyId: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  experienceIds: string[];
};

export type CombineSnapshot = {
  profileId: string;
  language: string;
  emphasis: string;
  companies: CombineCompanySnapshot[];
};

const VALID_LANGUAGES = new Set(["en", "ja", "zh-TW", "zh-CN", "ko"]);

type AssembleFromCombineParams = {
  userId: string;
  jobContext: string;
  combine: CombineSnapshot;
};

export async function assembleFromCombineSnapshot(
  params: AssembleFromCombineParams,
): Promise<ResumeGenerationInput> {
  const { combine, userId, jobContext } = params;

  if (!VALID_LANGUAGES.has(combine.language)) {
    throw new Error("Invalid resume output language.");
  }

  if (!combine.profileId) {
    throw new Error("Choose a profile for this run.");
  }
  if (combine.companies.length < 1) {
    throw new Error("Add at least one company entry for this run.");
  }

  const profile = await prisma.profile.findFirst({
    where: { id: combine.profileId, userId },
    include: {
      links: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) {
    throw new Error("Selected profile was not found.");
  }

  const companyIds = combine.companies.map((item) => item.companyId);
  const experienceIds = [
    ...new Set(
      combine.companies.flatMap((item) => item.experienceIds),
    ),
  ];

  const companies = await prisma.company.findMany({
    where: {
      userId,
      id: { in: companyIds },
    },
  });
  if (companies.length !== companyIds.length) {
    throw new Error("One or more selected companies were not found.");
  }

  const experiences =
    experienceIds.length > 0
      ? await prisma.experience.findMany({
          where: {
            userId,
            id: { in: experienceIds },
          },
        })
      : [];
  if (experiences.length !== experienceIds.length) {
    throw new Error("One or more selected experiences were not found.");
  }

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const experienceById = new Map(
    experiences.map((experience) => [experience.id, experience]),
  );

  const assembledCompanies = combine.companies.map((entry) => {
    const company = companyById.get(entry.companyId);
    if (!company) {
      throw new Error("One or more selected companies were not found.");
    }
    return {
      id: company.id,
      alias: company.alias,
      name: company.name,
      whatCompanyIs: company.whatCompanyIs,
      domainAndStack: company.domainAndStack,
      startDate: entry.startDate,
      endDate: entry.endDate,
      roleContext: entry.roleContext,
      experiences: entry.experienceIds.map((experienceId) => {
        const experience = experienceById.get(experienceId);
        if (!experience) {
          throw new Error("One or more selected experiences were not found.");
        }
        return {
          id: experience.id,
          category: experience.category,
          problem: experience.problem,
          actions: experience.actions,
          outcome: experience.outcome,
        };
      }),
    };
  });

  return {
    jobContext,
    profile: {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate,
      email: profile.email,
      pn: profile.pn,
      residence: profile.residence,
      university: profile.university,
      graduationYear: profile.graduationYear,
      graduationMonth: profile.graduationMonth,
      degree: profile.degree,
      links: profile.links.map((link) => ({
        key: link.key,
        link: link.link,
      })),
    },
    companies: assembledCompanies,
    run: {
      language: combine.language,
      emphasis: combine.emphasis ?? "",
    },
  };
}

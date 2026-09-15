import { liveExperienceWhere } from "./experience-live.js";
import { prisma } from "./prisma.js";

const profileLinksInclude = {
  links: { orderBy: { sortOrder: "asc" as const } },
};

function mapProfileLinks(
  links: { key: string; link: string | null; sortOrder: number }[],
) {
  return [...links]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: item.key,
      link: item.link,
    }));
}

export async function loadPce(userId: string) {
  const [profiles, companies, experiences] = await Promise.all([
    prisma.profile.findMany({
      where: { userId },
      include: profileLinksInclude,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.company.findMany({
      where: { userId },
      orderBy: [{ displayPriority: "asc" }, { name: "asc" }, { id: "asc" }],
    }),
    prisma.experience.findMany({
      where: liveExperienceWhere(userId),
      orderBy: { category: "asc" },
    }),
  ]);

  return {
    profiles: profiles.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      birthDate: row.birthDate,
      email: row.email,
      pn: row.pn,
      residence: row.residence,
      university: row.university,
      graduationYear: row.graduationYear,
      graduationMonth: row.graduationMonth,
      degree: row.degree,
      links: mapProfileLinks(row.links),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    companies: companies.map((row) => ({
      id: row.id,
      displayPriority: row.displayPriority,
      alias: row.alias,
      name: row.name,
      whatCompanyIs: row.whatCompanyIs,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    experiences: experiences.map((row) => ({
      id: row.id,
      category: row.category,
      problem: row.problem,
      actions: row.actions,
      outcome: row.outcome,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

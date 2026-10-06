import { prisma } from "../prisma";
import type {
  DraftRefineCompanyScene,
  DraftRefineExperienceMaterial,
} from "./types";

export async function loadDraftRefineExperiences(
  userId: string,
  experienceIds: string[],
): Promise<DraftRefineExperienceMaterial[]> {
  if (experienceIds.length === 0) {
    return [];
  }

  const rows = await prisma.experience.findMany({
    where: {
      userId,
      id: { in: experienceIds },
      deletedAt: null,
    },
    select: {
      id: true,
      category: true,
      problem: true,
      actions: true,
      outcome: true,
    },
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  return experienceIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .map((row) => ({
      id: row.id,
      category: row.category,
      problem: row.problem,
      actions: row.actions,
      outcome: row.outcome,
    }));
}

export async function loadDraftRefineCompanyScene(
  userId: string,
  companyId: string,
): Promise<DraftRefineCompanyScene | null> {
  const row = await prisma.company.findFirst({
    where: { userId, id: companyId },
    select: {
      id: true,
      alias: true,
      name: true,
      whatCompanyIs: true,
    },
  });
  if (!row) {
    return null;
  }
  return row;
}

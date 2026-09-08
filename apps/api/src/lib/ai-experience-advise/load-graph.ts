import { prisma } from "../prisma.js";
import type { ExperienceAdviseGraph } from "./types.js";

export async function loadExperienceAdviseGraph(
  userId: string,
  targetExperienceId?: string,
): Promise<ExperienceAdviseGraph> {
  if (targetExperienceId) {
    const target = await prisma.experience.findFirst({
      where: { id: targetExperienceId, userId },
      select: { id: true },
    });
    if (!target) {
      throw new Error("Experience was not found.");
    }
  }

  const rows = await prisma.experience.findMany({
    where: { userId },
    orderBy: { category: "asc" },
    select: {
      id: true,
      category: true,
      problem: true,
      actions: true,
      outcome: true,
    },
  });

  return {
    experiences: rows,
    targetExperienceId: targetExperienceId ?? null,
  };
}

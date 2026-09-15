import { liveExperienceWhere } from "../experience-live.js";
import { summarizeExperienceProblem } from "../experience-problem-summary.js";
import { prisma } from "../prisma.js";
import type { ExperienceIndexItem } from "./types.js";

export async function loadExperienceIndex(
  userId: string,
): Promise<ExperienceIndexItem[]> {
  const rows = await prisma.experience.findMany({
    where: liveExperienceWhere(userId),
    orderBy: { category: "asc" },
    select: { id: true, category: true, problem: true },
  });

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    problemSummary: summarizeExperienceProblem(row.problem),
  }));
}

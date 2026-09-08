import { prisma } from "../prisma.js";
import type { ExperienceIndexItem } from "./types.js";

function summarizeProblem(problem: string): string {
  const line = problem
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  return line ?? problem.trim().slice(0, 200);
}

export async function loadExperienceIndex(
  userId: string,
): Promise<ExperienceIndexItem[]> {
  const rows = await prisma.experience.findMany({
    where: { userId },
    orderBy: { category: "asc" },
    select: { id: true, category: true, problem: true },
  });

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    problemSummary: summarizeProblem(row.problem),
  }));
}

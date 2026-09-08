import { prisma } from "../prisma.js";

export async function buildExperienceAdviseFingerprint(
  userId: string,
): Promise<string> {
  const rows = await prisma.experience.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      category: true,
      problem: true,
      actions: true,
      outcome: true,
      updatedAt: true,
    },
  });

  return JSON.stringify(rows);
}

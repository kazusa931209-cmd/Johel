import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export function liveExperienceWhere(userId: string): Prisma.ExperienceWhereInput {
  return { userId, deletedAt: null };
}

export async function archiveExperience(input: {
  userId: string;
  experienceId: string;
}): Promise<void> {
  const existing = await prisma.experience.findFirst({
    where: {
      id: input.experienceId,
      ...liveExperienceWhere(input.userId),
    },
  });
  if (!existing) {
    throw new Error("Experience was not found.");
  }

  await prisma.$transaction([
    prisma.experienceEmbedding.deleteMany({
      where: { experienceId: input.experienceId },
    }),
    prisma.experience.update({
      where: { id: input.experienceId },
      data: { deletedAt: new Date() },
    }),
  ]);
}

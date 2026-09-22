import type { Generation } from "@prisma/client";
import { prisma } from "./prisma";

export async function setUserCurrentGeneration(
  userId: string,
  generationId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { currentGenerationId: generationId },
  });
}

export async function getUserCurrentGeneration(
  userId: string,
): Promise<Generation | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentGenerationId: true },
  });
  if (!user?.currentGenerationId) {
    return null;
  }

  const generation = await prisma.generation.findFirst({
    where: { id: user.currentGenerationId, userId },
  });
  if (generation) {
    return generation;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { currentGenerationId: null },
  });
  return null;
}

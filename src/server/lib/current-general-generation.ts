import type { Generation } from "@prisma/client";
import { GENERATION_KIND_GENERAL } from "./generation-public-id";
import { prisma } from "./prisma";

export async function setUserCurrentGeneralGeneration(
  userId: string,
  generationId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { currentGeneralGenerationId: generationId },
  });
}

export async function getUserCurrentGeneralGeneration(
  userId: string,
): Promise<Generation | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentGeneralGenerationId: true },
  });
  if (!user?.currentGeneralGenerationId) {
    return null;
  }

  const generation = await prisma.generation.findFirst({
    where: {
      id: user.currentGeneralGenerationId,
      userId,
      kind: GENERATION_KIND_GENERAL,
    },
  });
  if (generation) {
    return generation;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { currentGeneralGenerationId: null },
  });
  return null;
}

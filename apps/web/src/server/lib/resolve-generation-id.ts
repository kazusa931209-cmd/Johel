import { prisma } from "./prisma";

export async function resolveOwnedGenerationId(
  userId: string,
  generationId: string | undefined,
): Promise<string | undefined> {
  if (!generationId?.trim()) {
    return undefined;
  }

  const generation = await prisma.generation.findFirst({
    where: { id: generationId.trim(), userId },
    select: { id: true },
  });

  return generation?.id;
}

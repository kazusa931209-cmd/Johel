import { prisma } from "../prisma";
import { upsertExperienceEmbedding } from "./upsert";
import { deserializeEmbeddingVector } from "./vector";
import type { EmbeddingRankCandidate } from "./select-expanded-ids";

export async function ensureExperienceEmbeddings(input: {
  userId: string;
  apiKey: string;
  experiences: Array<{
    id: string;
    category: string;
    problem: string;
    actions: string;
    outcome: string;
  }>;
}): Promise<EmbeddingRankCandidate[]> {
  const existing = await prisma.experienceEmbedding.findMany({
    where: {
      experienceId: { in: input.experiences.map((item) => item.id) },
    },
    select: {
      experienceId: true,
      vector: true,
    },
  });

  const existingById = new Map(
    existing.map((row) => [row.experienceId, row.vector] as const),
  );

  for (const experience of input.experiences) {
    if (existingById.has(experience.id)) {
      continue;
    }
    await upsertExperienceEmbedding({
      userId: input.userId,
      apiKey: input.apiKey,
      experienceId: experience.id,
      category: experience.category,
      problem: experience.problem,
      actions: experience.actions,
      outcome: experience.outcome,
    });
    const row = await prisma.experienceEmbedding.findUnique({
      where: { experienceId: experience.id },
      select: { vector: true },
    });
    if (row) {
      existingById.set(experience.id, row.vector);
    }
  }

  return input.experiences.flatMap((experience) => {
    const vectorBuffer = existingById.get(experience.id);
    if (!vectorBuffer) {
      return [];
    }
    return [
      {
        id: experience.id,
        vector: deserializeEmbeddingVector(vectorBuffer),
      },
    ];
  });
}

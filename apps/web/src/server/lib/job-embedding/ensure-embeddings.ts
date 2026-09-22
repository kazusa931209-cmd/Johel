import { prisma } from "../prisma";
import { deserializeEmbeddingVector } from "../experience-embedding/vector";
import { buildJobEmbeddingInput } from "./build-input";
import { upsertGenerationJobEmbedding } from "./upsert";

export type JobEmbeddingCandidate = {
  generationId: string;
  publicId: string;
  finalized: boolean;
  filteredJobText: string;
  vector: number[];
};

export async function ensureGenerationJobEmbeddings(input: {
  userId: string;
  apiKey: string;
  generations: Array<{
    id: string;
    publicId: string;
    finalized: boolean;
    jobJson: string;
  }>;
}): Promise<JobEmbeddingCandidate[]> {
  const candidates: JobEmbeddingCandidate[] = [];

  for (const generation of input.generations) {
    const filteredJobText = buildJobEmbeddingInput(generation.jobJson);
    if (!filteredJobText) {
      continue;
    }

    const existing = await prisma.generationJobEmbedding.findUnique({
      where: { generationId: generation.id },
      select: { vector: true },
    });

    if (!existing) {
      await upsertGenerationJobEmbedding({
        userId: input.userId,
        apiKey: input.apiKey,
        generationId: generation.id,
        jobJson: generation.jobJson,
      });
    }

    const row = await prisma.generationJobEmbedding.findUnique({
      where: { generationId: generation.id },
      select: { vector: true },
    });
    if (!row) {
      continue;
    }

    candidates.push({
      generationId: generation.id,
      publicId: generation.publicId,
      finalized: generation.finalized,
      filteredJobText,
      vector: deserializeEmbeddingVector(row.vector),
    });
  }

  return candidates;
}

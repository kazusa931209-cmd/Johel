import {
  deserializeEmbeddingVector,
  rankByCosine,
} from "../experience-embedding/vector.js";
import { prisma } from "../prisma.js";
import { buildJobEmbeddingInput } from "./build-input.js";
import {
  JOB_DUPLICATE_SIMILARITY_THRESHOLD,
} from "./constants.js";
import { ensureGenerationJobEmbeddings } from "./ensure-embeddings.js";
import { upsertGenerationJobEmbedding } from "./upsert.js";

export type JobDuplicateMatch = {
  generationId: string;
  publicId: string;
  filteredJobText: string;
  finalized: boolean;
  score: number;
};

export async function findJobDuplicateMatch(input: {
  userId: string;
  apiKey: string;
  generationId: string;
}): Promise<JobDuplicateMatch | null> {
  const current = await prisma.generation.findFirst({
    where: { id: input.generationId, userId: input.userId },
    select: {
      id: true,
      jobJson: true,
      jobEmbedding: { select: { vector: true } },
    },
  });
  if (!current) {
    return null;
  }

  const currentText = buildJobEmbeddingInput(current.jobJson);
  if (!currentText) {
    return null;
  }

  await upsertGenerationJobEmbedding({
    userId: input.userId,
    apiKey: input.apiKey,
    generationId: current.id,
    jobJson: current.jobJson,
  });

  const currentEmbedding = await prisma.generationJobEmbedding.findUnique({
    where: { generationId: current.id },
    select: { vector: true },
  });
  if (!currentEmbedding) {
    return null;
  }

  const queryVector = deserializeEmbeddingVector(currentEmbedding.vector);

  const peers = await prisma.generation.findMany({
    where: {
      userId: input.userId,
      id: { not: current.id },
    },
    select: {
      id: true,
      publicId: true,
      finalized: true,
      jobJson: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const peerCandidates = await ensureGenerationJobEmbeddings({
    userId: input.userId,
    apiKey: input.apiKey,
    generations: peers,
  });

  if (peerCandidates.length === 0) {
    return null;
  }

  const ranked = rankByCosine(
    queryVector,
    peerCandidates.map((candidate) => ({
      id: candidate.generationId,
      vector: candidate.vector,
    })),
  );

  const best = ranked[0];
  if (!best || best.score < JOB_DUPLICATE_SIMILARITY_THRESHOLD) {
    return null;
  }

  const matched = peerCandidates.find(
    (candidate) => candidate.generationId === best.id,
  );
  if (!matched) {
    return null;
  }

  return {
    generationId: matched.generationId,
    publicId: matched.publicId,
    filteredJobText: matched.filteredJobText,
    finalized: matched.finalized,
    score: best.score,
  };
}

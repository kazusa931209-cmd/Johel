import { prisma } from "../prisma";
import { recordAiUsage } from "../record-ai-usage";
import {
  createOpenAiEmbedding,
  OPENAI_EMBEDDING_MODEL,
} from "../openai/embeddings";
import { serializeEmbeddingVector } from "../experience-embedding/vector";
import { buildJobEmbeddingInput } from "./build-input";
import { hashJobEmbeddingSource } from "./source-hash";

export async function upsertGenerationJobEmbedding(input: {
  userId: string;
  apiKey: string;
  generationId: string;
  jobJson: string;
}): Promise<{ skipped: boolean }> {
  const text = buildJobEmbeddingInput(input.jobJson);
  if (!text) {
    await prisma.generationJobEmbedding.deleteMany({
      where: { generationId: input.generationId },
    });
    return { skipped: true };
  }

  const sourceHash = hashJobEmbeddingSource(text);
  const existing = await prisma.generationJobEmbedding.findUnique({
    where: { generationId: input.generationId },
    select: { sourceHash: true },
  });
  if (existing?.sourceHash === sourceHash) {
    return { skipped: true };
  }

  const embedded = await createOpenAiEmbedding(input.apiKey, text);

  await recordAiUsage({
    userId: input.userId,
    aiProvider: "openai",
    generateType: "embedding",
    generationId: input.generationId,
    usage: {
      inputToken: embedded.inputToken,
      outputToken: 0,
      input: text,
      output: "",
    },
  });

  await prisma.generationJobEmbedding.upsert({
    where: { generationId: input.generationId },
    create: {
      generationId: input.generationId,
      model: OPENAI_EMBEDDING_MODEL,
      vector: serializeEmbeddingVector(embedded.vector) as Uint8Array<ArrayBuffer>,
      sourceHash,
    },
    update: {
      model: OPENAI_EMBEDDING_MODEL,
      vector: serializeEmbeddingVector(embedded.vector) as Uint8Array<ArrayBuffer>,
      sourceHash,
    },
  });

  return { skipped: false };
}

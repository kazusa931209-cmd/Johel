import { prisma } from "../prisma";
import { recordAiUsage } from "../record-ai-usage";
import {
  createOpenAiEmbedding,
  OPENAI_EMBEDDING_MODEL,
} from "../openai/embeddings";
import { buildExperienceEmbeddingInput } from "./build-input";
import { serializeEmbeddingVector } from "./vector";

export async function upsertExperienceEmbedding(input: {
  userId: string;
  apiKey: string;
  experienceId: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
}): Promise<void> {
  const text = buildExperienceEmbeddingInput({
    category: input.category,
    problem: input.problem,
    actions: input.actions,
    outcome: input.outcome,
  });

  const embedded = await createOpenAiEmbedding(input.apiKey, text);

  await recordAiUsage({
    userId: input.userId,
    aiProvider: "openai",
    generateType: "embedding",
    usage: {
      inputToken: embedded.inputToken,
      outputToken: 0,
      input: text,
      output: "",
    },
  });

  await prisma.experienceEmbedding.upsert({
    where: { experienceId: input.experienceId },
    create: {
      experienceId: input.experienceId,
      model: OPENAI_EMBEDDING_MODEL,
      vector: serializeEmbeddingVector(embedded.vector) as Uint8Array<ArrayBuffer>,
    },
    update: {
      model: OPENAI_EMBEDDING_MODEL,
      vector: serializeEmbeddingVector(embedded.vector) as Uint8Array<ArrayBuffer>,
    },
  });
}

import type { AiProviderId } from "./ai-provider.js";
import { OPENAI_EMBEDDING_MODEL } from "./openai/embeddings.js";
import {
  OPENAI_FORMAT_MODEL,
  OPENAI_RESUME_MODEL,
  OPENAI_VERDICT_MODEL,
} from "./openai/responses.js";
import { prisma } from "./prisma.js";

export const AI_GENERATE_TYPES = [
  "verdict",
  "jdMeta",
  "generate",
  "evaluate",
  "workflowRecommend",
  "markdownFormat",
  "authorAdvise",
  "experienceAdvise",
  "experienceSplit",
  "combineRecommend",
  "embedding",
] as const;

export type AiGenerateType = (typeof AI_GENERATE_TYPES)[number];

type TokenUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export function resolveAiModelName(
  _provider: AiProviderId,
  generateType: AiGenerateType,
): string {
  if (generateType === "generate") {
    return OPENAI_RESUME_MODEL;
  }
  if (generateType === "markdownFormat") {
    return OPENAI_FORMAT_MODEL;
  }
  if (generateType === "embedding") {
    return OPENAI_EMBEDDING_MODEL;
  }
  return OPENAI_VERDICT_MODEL;
}

export async function recordAiUsage(input: {
  userId: string;
  aiProvider: AiProviderId;
  generateType: AiGenerateType;
  generationId?: string;
  usage: TokenUsage;
}) {
  await prisma.aiUsage.create({
    data: {
      userId: input.userId,
      generationId: input.generationId,
      aiProvider: input.aiProvider,
      modelName: resolveAiModelName(input.aiProvider, input.generateType),
      generateType: input.generateType,
      inputToken: input.usage.inputToken,
      outputToken: input.usage.outputToken,
      input: input.usage.input,
      output: input.usage.output,
    },
  });

  if (input.generationId) {
    await prisma.generation.updateMany({
      where: {
        id: input.generationId,
        userId: input.userId,
      },
      data: {
        inputToken: { increment: input.usage.inputToken },
        outputToken: { increment: input.usage.outputToken },
      },
    });
  }
}

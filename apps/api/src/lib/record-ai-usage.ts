import type { AiProviderId } from "./ai-provider.js";
import {
  OPENAI_RESUME_MODEL,
  OPENAI_VERDICT_MODEL,
} from "./openai/responses.js";
import { prisma } from "./prisma.js";

export const AI_GENERATE_TYPES = [
  "verdict",
  "generate",
  "evaluate",
  "promptOptimize",
  "promptHelper",
] as const;

export type AiGenerateType = (typeof AI_GENERATE_TYPES)[number];

export const CURSOR_MODEL_NAME = "auto";

type TokenUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export function resolveAiModelName(
  provider: AiProviderId,
  generateType: AiGenerateType,
): string {
  if (provider === "cursor") {
    return CURSOR_MODEL_NAME;
  }
  if (generateType === "generate") {
    return OPENAI_RESUME_MODEL;
  }
  return OPENAI_VERDICT_MODEL;
}

export async function recordAiUsage(input: {
  userId: string;
  aiProvider: AiProviderId;
  generateType: AiGenerateType;
  usage: TokenUsage;
}) {
  await prisma.aiUsage.create({
    data: {
      userId: input.userId,
      aiProvider: input.aiProvider,
      modelName: resolveAiModelName(input.aiProvider, input.generateType),
      generateType: input.generateType,
      inputToken: input.usage.inputToken,
      outputToken: input.usage.outputToken,
      input: input.usage.input,
      output: input.usage.output,
    },
  });
}

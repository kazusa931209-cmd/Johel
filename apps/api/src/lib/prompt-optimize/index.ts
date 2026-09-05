import type { AiProviderId } from "../ai-provider.js";
import type { AiVerdictUsage } from "../ai-verdict/types.js";
import { prisma } from "../prisma.js";
import { compileInstruction, type PromptInstructionKind } from "./compile.js";
import { hashPromptSource } from "./hash.js";
import { runPromptRewrite } from "./rewrite.js";

export type { PromptInstructionKind } from "./compile.js";
export { compileInstruction, PROMPT_COMPILER_VERSION } from "./compile.js";
export { hashPromptSource } from "./hash.js";

export type OptimizeInstructionResult = {
  instruction: string;
  rewriteUsage?: AiVerdictUsage;
};

export async function getUsePromptOptimizationAi(userId: string): Promise<boolean> {
  const process = await prisma.generationProcess.findUnique({
    where: { userId },
  });
  return process?.usePromptOptimizationAi ?? true;
}

export async function optimizeInstruction(input: {
  userId: string;
  kind: PromptInstructionKind;
  originalPrompt: string;
  provider: AiProviderId;
  apiKey: string;
  usePromptOptimizationAi: boolean;
}): Promise<OptimizeInstructionResult> {
  const compiled = compileInstruction(input.kind, input.originalPrompt);

  if (!input.usePromptOptimizationAi) {
    return { instruction: compiled };
  }

  const sourceHash = hashPromptSource(input.kind, input.originalPrompt);
  const cached = await prisma.promptOptimization.findUnique({
    where: {
      userId_kind_sourceHash: {
        userId: input.userId,
        kind: input.kind,
        sourceHash,
      },
    },
  });

  if (cached) {
    return { instruction: cached.optimizedPrompt };
  }

  try {
    const rewrite = await runPromptRewrite(
      input.provider,
      input.apiKey,
      compiled,
    );

    await prisma.promptOptimization.upsert({
      where: {
        userId_kind_sourceHash: {
          userId: input.userId,
          kind: input.kind,
          sourceHash,
        },
      },
      create: {
        userId: input.userId,
        kind: input.kind,
        sourceHash,
        optimizedPrompt: rewrite.text,
      },
      update: {
        optimizedPrompt: rewrite.text,
      },
    });

    return {
      instruction: rewrite.text,
      rewriteUsage: rewrite.usage,
    };
  } catch {
    return { instruction: compiled };
  }
}

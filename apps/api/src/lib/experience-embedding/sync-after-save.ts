import { prisma } from "../prisma.js";
import { upsertExperienceEmbedding } from "./upsert.js";

export async function syncExperienceEmbeddingAfterSave(input: {
  userId: string;
  experienceId: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
}): Promise<void> {
  const setting = await prisma.setting.findUnique({
    where: { userId: input.userId },
  });
  if (!setting?.apiKey) {
    return;
  }

  await upsertExperienceEmbedding({
    userId: input.userId,
    apiKey: setting.apiKey,
    experienceId: input.experienceId,
    category: input.category,
    problem: input.problem,
    actions: input.actions,
    outcome: input.outcome,
  });
}

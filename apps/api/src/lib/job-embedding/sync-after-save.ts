import { prisma } from "../prisma.js";
import { upsertGenerationJobEmbedding } from "./upsert.js";

export async function syncGenerationJobEmbeddingAfterSave(input: {
  userId: string;
  generationId: string;
  jobJson: string;
}): Promise<void> {
  const setting = await prisma.setting.findUnique({
    where: { userId: input.userId },
  });
  if (!setting?.apiKey) {
    return;
  }

  await upsertGenerationJobEmbedding({
    userId: input.userId,
    apiKey: setting.apiKey,
    generationId: input.generationId,
    jobJson: input.jobJson,
  });
}

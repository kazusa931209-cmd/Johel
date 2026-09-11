import { getUserAiSettings } from "../user-ai-settings.js";
import { upsertGenerationJobEmbedding } from "./upsert.js";

export async function syncGenerationJobEmbeddingAfterSave(input: {
  userId: string;
  generationId: string;
  jobJson: string;
}): Promise<void> {
  const aiSettings = await getUserAiSettings(input.userId);
  if (!aiSettings) {
    return;
  }

  await upsertGenerationJobEmbedding({
    userId: input.userId,
    apiKey: aiSettings.apiKey,
    generationId: input.generationId,
    jobJson: input.jobJson,
  });
}

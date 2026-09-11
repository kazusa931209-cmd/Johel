import { getUserAiSettings } from "../user-ai-settings.js";
import { upsertExperienceEmbedding } from "./upsert.js";

export async function syncExperienceEmbeddingAfterSave(input: {
  userId: string;
  experienceId: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
}): Promise<void> {
  const aiSettings = await getUserAiSettings(input.userId);
  if (!aiSettings) {
    return;
  }

  await upsertExperienceEmbedding({
    userId: input.userId,
    apiKey: aiSettings.apiKey,
    experienceId: input.experienceId,
    category: input.category,
    problem: input.problem,
    actions: input.actions,
    outcome: input.outcome,
  });
}

import { loadExperienceAdviseContext } from "./load-context.js";
import type { ExperienceAdviseGraph } from "./types.js";

export async function loadExperienceAdviseGraph(
  userId: string,
  targetExperienceId?: string,
): Promise<ExperienceAdviseGraph> {
  const { graph } = await loadExperienceAdviseContext(userId, targetExperienceId);
  return graph;
}

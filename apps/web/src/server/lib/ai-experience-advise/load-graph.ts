import { loadExperienceAdviseContext } from "./load-context";
import type { ExperienceAdviseGraph } from "./types";

export async function loadExperienceAdviseGraph(
  userId: string,
  targetExperienceId?: string,
): Promise<ExperienceAdviseGraph> {
  const { graph } = await loadExperienceAdviseContext(userId, targetExperienceId);
  return graph;
}

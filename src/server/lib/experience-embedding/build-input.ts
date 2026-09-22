export type ExperienceEmbeddingSource = {
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

export function buildExperienceEmbeddingInput(
  experience: ExperienceEmbeddingSource,
): string {
  return [
    experience.category.trim(),
    experience.problem.trim(),
    experience.actions.trim(),
    experience.outcome.trim(),
  ]
    .filter((part) => part.length > 0)
    .join("\n\n");
}

import type { ExperienceDetail } from "@/lib/experience";

export function experienceSearchText(experience: ExperienceDetail): string {
  return [
    experience.category,
    experience.problem,
    experience.actions,
    experience.outcome,
  ]
    .join("\n")
    .toLowerCase();
}

export function matchesExperienceSearch(
  experience: ExperienceDetail,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return experienceSearchText(experience).includes(normalized);
}

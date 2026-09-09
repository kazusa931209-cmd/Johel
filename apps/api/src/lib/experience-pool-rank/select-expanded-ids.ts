import { selectTopKeywordExperienceIds } from "./keyword-rank.js";

export const DEFAULT_ADVISE_FULL_STAR_K = 10;
export const DEFAULT_ADVISE_RECENT_N = 3;

export type SelectExpandedExperienceIdsInput = {
  userFacts: string;
  experiences: Array<{
    id: string;
    category: string;
    problem: string;
    updatedAt: Date | string;
  }>;
  targetExperienceId?: string | null;
  topK?: number;
  recentN?: number;
};

export function selectRecentExperienceIds(
  experiences: SelectExpandedExperienceIdsInput["experiences"],
  recentN: number,
): string[] {
  if (recentN <= 0 || experiences.length === 0) {
    return [];
  }

  return [...experiences]
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime || a.id.localeCompare(b.id);
    })
    .slice(0, recentN)
    .map((experience) => experience.id);
}

export function selectExpandedExperienceIds(
  input: SelectExpandedExperienceIdsInput,
): Set<string> {
  const topK = input.topK ?? DEFAULT_ADVISE_FULL_STAR_K;
  const recentN = input.recentN ?? DEFAULT_ADVISE_RECENT_N;
  const expanded = new Set<string>();

  if (input.targetExperienceId) {
    expanded.add(input.targetExperienceId);
  }

  for (const id of selectTopKeywordExperienceIds(
    input.userFacts,
    input.experiences,
    topK,
  )) {
    expanded.add(id);
  }

  for (const id of selectRecentExperienceIds(input.experiences, recentN)) {
    expanded.add(id);
  }

  return expanded;
}

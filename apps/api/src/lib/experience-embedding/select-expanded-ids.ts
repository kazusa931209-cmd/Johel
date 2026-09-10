import {
  DEFAULT_ADVISE_RECENT_N,
  selectRecentExperienceIds,
} from "../experience-pool-rank/select-expanded-ids.js";
import type { ExperienceAdvisePoolDepth } from "./pool-depth.js";
import { resolveExperienceAdviseFullStarK } from "./pool-depth.js";
import { rankByCosine } from "./vector.js";

export type EmbeddingRankCandidate = {
  id: string;
  vector: number[];
};

export type SelectExpandedExperienceIdsWithEmbeddingInput = {
  experiences: Array<{
    id: string;
    updatedAt: Date | string;
  }>;
  targetExperienceId?: string | null;
  poolDepth: ExperienceAdvisePoolDepth;
  queryVector: number[];
  embeddingCandidates: EmbeddingRankCandidate[];
  recentN?: number;
};

export function selectTopEmbeddingExperienceIds(
  queryVector: number[],
  candidates: EmbeddingRankCandidate[],
  topK: number,
): string[] {
  if (topK <= 0 || candidates.length === 0) {
    return [];
  }

  return rankByCosine(queryVector, candidates)
    .slice(0, topK)
    .map((item) => item.id);
}

export function selectExpandedExperienceIdsWithEmbedding(
  input: SelectExpandedExperienceIdsWithEmbeddingInput,
): Set<string> {
  const recentN = input.recentN ?? DEFAULT_ADVISE_RECENT_N;
  const expanded = new Set<string>();

  if (input.targetExperienceId) {
    expanded.add(input.targetExperienceId);
  }

  const fullStarK = resolveExperienceAdviseFullStarK(input.poolDepth);
  if (fullStarK === null) {
    for (const experience of input.experiences) {
      expanded.add(experience.id);
    }
    return expanded;
  }

  for (const id of selectTopEmbeddingExperienceIds(
    input.queryVector,
    input.embeddingCandidates,
    fullStarK,
  )) {
    expanded.add(id);
  }

  for (const id of selectRecentExperienceIds(input.experiences, recentN)) {
    expanded.add(id);
  }

  return expanded;
}

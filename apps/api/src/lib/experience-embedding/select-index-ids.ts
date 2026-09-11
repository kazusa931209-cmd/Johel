import {
  EXPERIENCE_INDEX_TRUNCATION_THRESHOLD,
  type ExperienceAdvisePoolDepth,
  resolveExperienceAdviseIndexK,
} from "./pool-depth.js";

export type SelectIndexExperienceIdsInput = {
  experiences: Array<{ id: string }>;
  expandedIds: Set<string>;
  poolDepth: ExperienceAdvisePoolDepth;
  embeddingRankedIds: string[];
};

export type SelectIndexExperienceIdsResult = {
  indexIds: Set<string>;
  truncated: boolean;
  totalPoolSize: number;
};

export function selectIndexExperienceIdsForAdvise(
  input: SelectIndexExperienceIdsInput,
): SelectIndexExperienceIdsResult {
  const totalPoolSize = input.experiences.length;
  const nonExpandedIds = input.experiences
    .filter((experience) => !input.expandedIds.has(experience.id))
    .map((experience) => experience.id);

  if (totalPoolSize === 0 || nonExpandedIds.length === 0) {
    return {
      indexIds: new Set<string>(),
      truncated: false,
      totalPoolSize,
    };
  }

  if (input.poolDepth === "full") {
    return {
      indexIds: new Set<string>(),
      truncated: false,
      totalPoolSize,
    };
  }

  if (totalPoolSize <= EXPERIENCE_INDEX_TRUNCATION_THRESHOLD) {
    return {
      indexIds: new Set(nonExpandedIds),
      truncated: false,
      totalPoolSize,
    };
  }

  const indexK = resolveExperienceAdviseIndexK(input.poolDepth);
  if (indexK == null) {
    return {
      indexIds: new Set(nonExpandedIds),
      truncated: false,
      totalPoolSize,
    };
  }

  const indexIds = new Set<string>();
  for (const id of input.embeddingRankedIds) {
    if (input.expandedIds.has(id)) {
      continue;
    }
    indexIds.add(id);
    if (indexIds.size >= indexK) {
      break;
    }
  }

  return {
    indexIds,
    truncated: indexIds.size < nonExpandedIds.length,
    totalPoolSize,
  };
}

import { summarizeExperienceProblem } from "../experience-problem-summary";

export type KeywordRankExperience = {
  id: string;
  category: string;
  problem: string;
};

const TOKEN_SPLIT = /[^a-z0-9]+/i;

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const part of text.toLowerCase().split(TOKEN_SPLIT)) {
    const trimmed = part.trim();
    if (trimmed.length >= 2) {
      tokens.add(trimmed);
    }
  }
  return tokens;
}

function scoreOverlap(queryTokens: Set<string>, candidateText: string): number {
  if (queryTokens.size === 0) {
    return 0;
  }
  const candidateTokens = tokenize(candidateText);
  let overlap = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) {
      overlap += 1;
    }
  }
  return overlap;
}

export function rankExperiencesByKeywordOverlap(
  userFacts: string,
  experiences: KeywordRankExperience[],
): Array<{ id: string; score: number }> {
  const queryTokens = tokenize(userFacts);
  return experiences
    .map((experience) => ({
      id: experience.id,
      score: scoreOverlap(
        queryTokens,
        `${experience.category} ${summarizeExperienceProblem(experience.problem)}`,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function selectTopKeywordExperienceIds(
  userFacts: string,
  experiences: KeywordRankExperience[],
  topK: number,
): string[] {
  if (topK <= 0 || experiences.length === 0) {
    return [];
  }
  return rankExperiencesByKeywordOverlap(userFacts, experiences)
    .slice(0, topK)
    .map((item) => item.id);
}

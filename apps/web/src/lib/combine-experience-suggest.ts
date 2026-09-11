import type { CombineSnapshot } from "@/components/generate/combine-types";
import type {
  CombineRecommendCompanyResult,
  CombineRecommendResult,
} from "@/lib/api";

export function mergeExperienceSuggestions(
  combine: CombineSnapshot,
  result: CombineRecommendResult,
): CombineSnapshot["companies"] {
  const byCompanyId = new Map(
    result.companies.map((item) => [item.companyId, item.experienceIds]),
  );
  return combine.companies.map((entry) => ({
    ...entry,
    experienceIds: byCompanyId.get(entry.companyId) ?? entry.experienceIds,
  }));
}

export function mergeExperienceSuggestionsForCompany(
  combine: CombineSnapshot,
  result: CombineRecommendResult,
  companyId: string,
): CombineSnapshot["companies"] {
  const suggestion = result.companies.find(
    (item) => item.companyId === companyId,
  );
  if (!suggestion) {
    return combine.companies;
  }
  return combine.companies.map((entry) =>
    entry.companyId === companyId
      ? { ...entry, experienceIds: suggestion.experienceIds }
      : entry,
  );
}

export function mergeCombineRecommendResults(
  previous: CombineRecommendResult | null,
  incoming: CombineRecommendResult,
): CombineRecommendResult {
  const byCompanyId = new Map<string, CombineRecommendCompanyResult>(
    previous?.companies.map((item) => [item.companyId, item]) ?? [],
  );
  for (const item of incoming.companies) {
    byCompanyId.set(item.companyId, item);
  }
  return {
    companies: [...byCompanyId.values()],
    warnings: [...(previous?.warnings ?? []), ...incoming.warnings],
    tokenUsed: incoming.tokenUsed,
  };
}

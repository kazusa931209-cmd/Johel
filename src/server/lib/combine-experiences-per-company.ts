export const DEFAULT_COMBINE_EXPERIENCES_PER_COMPANY_MAX = 5;
export const DEFAULT_COMBINE_EXPERIENCES_PER_COMPANY_MIN = 2;
export const MIN_COMBINE_EXPERIENCES_PER_COMPANY_MAX = 1;
export const MAX_COMBINE_EXPERIENCES_PER_COMPANY_MAX = 10;

export function normalizeCombineExperiencesPerCompanyMax(
  value: number | null | undefined,
): number {
  if (value == null || !Number.isFinite(value)) {
    return DEFAULT_COMBINE_EXPERIENCES_PER_COMPANY_MAX;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_COMBINE_EXPERIENCES_PER_COMPANY_MAX,
    Math.max(MIN_COMBINE_EXPERIENCES_PER_COMPANY_MAX, rounded),
  );
}

export function normalizeCombineExperiencesPerCompanyMin(
  value: number | null | undefined,
  maxPerCompany: number,
): number {
  const max = normalizeCombineExperiencesPerCompanyMax(maxPerCompany);
  if (value == null || !Number.isFinite(value)) {
    return Math.min(
      max,
      Math.max(
        MIN_COMBINE_EXPERIENCES_PER_COMPANY_MAX,
        DEFAULT_COMBINE_EXPERIENCES_PER_COMPANY_MIN,
      ),
    );
  }
  const rounded = Math.round(value);
  return Math.min(
    max,
    Math.max(MIN_COMBINE_EXPERIENCES_PER_COMPANY_MAX, rounded),
  );
}

export function resolveCombineExperiencesPerCompanyRange(
  maxPerCompany: number,
  minPerCompany?: number | null,
): {
  minPerCompany: number;
  maxPerCompany: number;
  thinOverlapMaxPerCompany: number;
} {
  const max = normalizeCombineExperiencesPerCompanyMax(maxPerCompany);
  const min = normalizeCombineExperiencesPerCompanyMin(minPerCompany, max);
  const thinOverlapMaxPerCompany = Math.min(2, max);
  return { minPerCompany: min, maxPerCompany: max, thinOverlapMaxPerCompany };
}

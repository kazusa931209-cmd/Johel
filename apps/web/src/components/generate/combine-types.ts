export const RUN_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh-TW", label: "Chinese (Taiwan)" },
  { value: "zh-CN", label: "Chinese (Mainland)" },
  { value: "ko", label: "Korean" },
] as const;

export type RunLanguage = (typeof RUN_LANGUAGES)[number]["value"];

export type CombineCompanyEntry = {
  companyId: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  keywordContext: string;
  experienceIds: string[];
};

export type CombineSnapshot = {
  profileId: string;
  language: RunLanguage | string;
  emphasis: string;
  companies: CombineCompanyEntry[];
};

export const EMPTY_COMBINE_SNAPSHOT: CombineSnapshot = {
  profileId: "",
  language: "en",
  emphasis: "",
  companies: [],
};

export type CombineFieldErrors = {
  profileId?: string;
  companies?: string;
  language?: string;
};

export function formatCompanyPeriod(startDate: string, endDate: string): string {
  return `${startDate.trim()} – ${endDate.trim()}`;
}

export function validateCombineSnapshot(
  snapshot: CombineSnapshot,
  t: (key: string) => string,
  graduation?: { year: number; month: number } | null,
): CombineFieldErrors {
  const errors: CombineFieldErrors = {};
  if (!snapshot.profileId) {
    errors.profileId = t("validation.profileRequired");
  }
  if (snapshot.profileId && graduation == null) {
    errors.companies = t("validation.profileGraduationRequired");
    return errors;
  }
  if (snapshot.companies.length < 1) {
    errors.companies = t("validation.companiesMinOne");
    return errors;
  }
  const invalidEntry = snapshot.companies.some(
    (entry) =>
      !entry.companyId ||
      !entry.startDate.trim() ||
      !entry.endDate.trim() ||
      !entry.roleContext.trim(),
  );
  if (invalidEntry) {
    errors.companies = t("validation.companyEntryIncomplete");
  }
  return errors;
}

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
  /** General Resume (Resume Builder): per-run user instruction; not persisted in combine defaults. */
  userInstruction: string;
  /** General Resume (Resume Builder): optional run label; shown on Resumes and used for suggest/generate. */
  platform: string;
  companies: CombineCompanyEntry[];
};

export const EMPTY_COMBINE_SNAPSHOT: CombineSnapshot = {
  profileId: "",
  language: "en",
  emphasis: "",
  userInstruction: "",
  platform: "",
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

export function getCombineCompanySuggestError(
  snapshot: CombineSnapshot,
  companyId: string,
  graduation: { year: number; month: number } | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!snapshot.profileId) {
    return t("validation.profileRequired");
  }
  if (graduation == null) {
    return t("validation.profileGraduationRequired");
  }
  const entry = snapshot.companies.find((item) => item.companyId === companyId);
  if (!entry) {
    return t("generate.combine.suggestCompanyNotIncluded");
  }
  if (
    !entry.startDate.trim() ||
    !entry.endDate.trim() ||
    !entry.roleContext.trim()
  ) {
    return t("validation.companyEntryIncomplete");
  }
  return null;
}

export function isCombineRunReady(
  snapshot: CombineSnapshot,
  graduation?: { year: number; month: number } | null,
): boolean {
  const errors = validateCombineSnapshot(snapshot, () => "", graduation);
  if (Object.keys(errors).length > 0) {
    return false;
  }
  return snapshot.companies.some((entry) => entry.experienceIds.length > 0);
}

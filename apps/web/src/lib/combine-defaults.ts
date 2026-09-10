import type { CombineSnapshot } from "@/components/generate/combine-types";

export const COMBINE_DEFAULTS_STORAGE_KEY_PREFIX = "johel:combine-defaults:";

export type CombineDefaultCompanyEntry = {
  companyId: string;
  startDate: string;
  endDate: string;
  roleContext: string;
  keywordContext: string;
};

export type CombineSelectionDefaults = {
  profileId: string;
  companies: CombineDefaultCompanyEntry[];
};

function storageKey(userId: string) {
  return `${COMBINE_DEFAULTS_STORAGE_KEY_PREFIX}${userId}`;
}

export function isCombineSelectionEmpty(combine: CombineSnapshot): boolean {
  return !combine.profileId && combine.companies.length === 0;
}

export function extractCombineDefaults(
  combine: CombineSnapshot,
): CombineSelectionDefaults | null {
  if (isCombineSelectionEmpty(combine)) {
    return null;
  }
  return {
    profileId: combine.profileId,
    companies: combine.companies.map(
      ({ companyId, startDate, endDate, roleContext, keywordContext }) => ({
        companyId,
        startDate,
        endDate,
        roleContext,
        keywordContext,
      }),
    ),
  };
}

export function applyCombineDefaults(
  base: CombineSnapshot,
  defaults: CombineSelectionDefaults,
): CombineSnapshot {
  return {
    ...base,
    profileId: defaults.profileId,
    companies: defaults.companies.map((entry) => ({
      ...entry,
      experienceIds: [],
    })),
  };
}

export function seedCombineFromDefaults(
  combine: CombineSnapshot,
  userId: string | null,
): CombineSnapshot {
  if (!userId || !isCombineSelectionEmpty(combine)) {
    return combine;
  }
  const defaults = loadCombineDefaults(userId);
  if (!defaults) {
    return combine;
  }
  return applyCombineDefaults(combine, defaults);
}

export function sanitizeCombineSelection(
  combine: CombineSnapshot,
  validProfileIds: Set<string>,
  validCompanyIds: Set<string>,
): CombineSnapshot | null {
  if (isCombineSelectionEmpty(combine)) {
    return null;
  }

  if (combine.profileId && !validProfileIds.has(combine.profileId)) {
    return { ...combine, profileId: "", companies: [] };
  }

  const nextCompanies = combine.companies.filter((entry) =>
    validCompanyIds.has(entry.companyId),
  );
  if (nextCompanies.length === combine.companies.length) {
    return null;
  }
  return { ...combine, companies: nextCompanies };
}

export function loadCombineDefaults(
  userId: string,
): CombineSelectionDefaults | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    return parseCombineSelectionDefaults(parsed);
  } catch {
    return null;
  }
}

export function persistCombineDefaults(
  userId: string,
  defaults: CombineSelectionDefaults | null,
) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const key = storageKey(userId);
    if (!defaults) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(defaults));
  } catch {
    // ignore quota / private mode
  }
}

export function persistCombineDefaultsFromSnapshot(
  userId: string,
  combine: CombineSnapshot,
) {
  persistCombineDefaults(userId, extractCombineDefaults(combine));
}

function parseCombineSelectionDefaults(
  value: unknown,
): CombineSelectionDefaults | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const profileId =
    typeof raw.profileId === "string" ? raw.profileId.trim() : "";
  const companiesRaw = Array.isArray(raw.companies) ? raw.companies : [];
  const companies: CombineDefaultCompanyEntry[] = [];

  for (const item of companiesRaw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const entry = item as Record<string, unknown>;
    const companyId =
      typeof entry.companyId === "string" ? entry.companyId.trim() : "";
    if (!companyId) {
      continue;
    }
    companies.push({
      companyId,
      startDate: typeof entry.startDate === "string" ? entry.startDate : "",
      endDate: typeof entry.endDate === "string" ? entry.endDate : "",
      roleContext:
        typeof entry.roleContext === "string" ? entry.roleContext : "",
      keywordContext:
        typeof entry.keywordContext === "string" ? entry.keywordContext : "",
    });
  }

  if (!profileId && companies.length === 0) {
    return null;
  }

  return { profileId, companies };
}

import {
  listCompanies,
  listExperiences,
  listGenerations,
  listProfiles,
} from "@/lib/api";
import {
  filterGlobalSearchNavItems,
  GLOBAL_SEARCH_NAV_ITEMS,
  type GlobalSearchNavItem,
} from "@/lib/global-search-nav";
import { fullName } from "@/lib/profile";

export type GlobalSearchResultKind =
  | "navigation"
  | "profile"
  | "company"
  | "experience"
  | "generation";

export type GlobalSearchResult = {
  id: string;
  kind: GlobalSearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
};

type TranslateFn = (key: string) => string;

const ENTITY_RESULT_LIMIT = 5;

function navItemToResult(
  item: GlobalSearchNavItem,
  labelsByKey: Record<string, string>,
): GlobalSearchResult {
  return {
    id: `nav:${item.id}`,
    kind: "navigation",
    title: labelsByKey[item.labelKey] ?? item.labelKey,
    href: item.href,
  };
}

export async function runGlobalSearch(
  query: string,
  labelsByKey: Record<string, string>,
): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  const navItems = filterGlobalSearchNavItems(trimmed, labelsByKey);
  const navResults = navItems.map((item) => navItemToResult(item, labelsByKey));

  if (!trimmed) {
    return navResults;
  }

  const [profilesRes, companiesRes, experiencesRes, generationsRes] =
    await Promise.all([
      listProfiles(trimmed, 1, ENTITY_RESULT_LIMIT),
      listCompanies(trimmed, 1, ENTITY_RESULT_LIMIT),
      listExperiences(trimmed, 1, ENTITY_RESULT_LIMIT),
      listGenerations(trimmed, 1),
    ]);

  const entityResults: GlobalSearchResult[] = [];

  for (const profile of profilesRes.data?.items ?? []) {
    entityResults.push({
      id: `profile:${profile.id}`,
      kind: "profile",
      title: fullName(profile.firstName, profile.lastName) || profile.id,
      subtitle: profile.email ?? profile.university ?? undefined,
      href: `/profiles/${profile.id}/edit`,
    });
  }

  for (const company of companiesRes.data?.items ?? []) {
    entityResults.push({
      id: `company:${company.id}`,
      kind: "company",
      title: company.name,
      subtitle: company.alias !== company.name ? company.alias : undefined,
      href: `/companies/${company.id}/edit`,
    });
  }

  for (const experience of experiencesRes.data?.items ?? []) {
    entityResults.push({
      id: `experience:${experience.id}`,
      kind: "experience",
      title: experience.category,
      subtitle: experience.problem.slice(0, 120) || undefined,
      href: `/experiences/${experience.id}/edit`,
    });
  }

  for (const generation of (generationsRes.data?.items ?? []).slice(
    0,
    ENTITY_RESULT_LIMIT,
  )) {
    entityResults.push({
      id: `generation:${generation.id}`,
      kind: "generation",
      title: generation.publicId,
      subtitle: generation.information,
      href: `/history?publicId=${encodeURIComponent(generation.publicId)}`,
    });
  }

  return [...navResults, ...entityResults];
}

export function buildGlobalSearchLabelMap(
  translate: TranslateFn,
): Record<string, string> {
  const keys = new Set<string>();
  for (const item of GLOBAL_SEARCH_NAV_ITEMS) {
    keys.add(item.labelKey);
  }
  return Object.fromEntries(
    [...keys].map((key) => [key, translate(key)]),
  );
}

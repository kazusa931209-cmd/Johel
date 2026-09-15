export type GlobalSearchNavItem = {
  id: string;
  labelKey: string;
  href: string;
  keywords?: string[];
};

export const GLOBAL_SEARCH_NAV_ITEMS: GlobalSearchNavItem[] = [
  {
    id: "generate",
    labelKey: "nav.sidebar.generate",
    href: "/",
    keywords: ["run", "resume"],
  },
  {
    id: "profiles",
    labelKey: "nav.sidebar.profiles",
    href: "/profiles",
    keywords: ["profile", "candidate"],
  },
  {
    id: "companies",
    labelKey: "nav.sidebar.companies",
    href: "/companies",
    keywords: ["company", "employer"],
  },
  {
    id: "experiences",
    labelKey: "nav.sidebar.experiences",
    href: "/experiences",
    keywords: ["experience", "card"],
  },
  {
    id: "history",
    labelKey: "nav.sidebar.history",
    href: "/history",
    keywords: ["generation", "past"],
  },
  {
    id: "environment",
    labelKey: "nav.sidebar.environment",
    href: "/settings/environment",
    keywords: ["settings", "environment", "api"],
  },
  {
    id: "generation-settings",
    labelKey: "nav.sidebar.generation",
    href: "/settings/generation",
    keywords: ["settings", "process", "decay"],
  },
  {
    id: "prompts",
    labelKey: "nav.sidebar.prompts",
    href: "/settings/prompts",
    keywords: ["settings", "prompt", "verdict"],
  },
  {
    id: "account",
    labelKey: "nav.header.account",
    href: "/account",
    keywords: ["account", "password"],
  },
];

export function filterGlobalSearchNavItems(
  query: string,
  labelsByKey: Record<string, string>,
): GlobalSearchNavItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return GLOBAL_SEARCH_NAV_ITEMS;
  }

  return GLOBAL_SEARCH_NAV_ITEMS.filter((item) => {
    const label = labelsByKey[item.labelKey]?.toLowerCase() ?? "";
    if (label.includes(normalized)) {
      return true;
    }
    return (item.keywords ?? []).some((keyword) => keyword.includes(normalized));
  });
}

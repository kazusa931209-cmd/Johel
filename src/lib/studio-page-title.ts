const STATIC_PATH_TITLE_KEYS: Record<string, string> = {
  "/": "generate.title",
  "/resume-builder": "resumeBuilder.title",
  "/application-builder": "nav.sidebar.applicationBuilder",
  "/applications": "nav.sidebar.applications",
  "/compare-choose": "nav.sidebar.compareAndChoose",
  "/profiles": "crud.profiles.title",
  "/companies": "crud.companies.title",
  "/experiences": "crud.experiences.title",
  "/history": "nav.sidebar.resumes",
  "/account": "account.title",
  "/settings/environment": "settings.environment.title",
  "/settings/generation": "settings.generation.title",
  "/settings/prompts": "settings.prompts.title",
};

const DYNAMIC_TITLE_RULES: Array<{
  pattern: RegExp;
  key: string;
}> = [
  { pattern: /^\/profiles\/new$/, key: "crud.profiles.form.addTitle" },
  { pattern: /^\/profiles\/[^/]+\/edit$/, key: "crud.profiles.form.editTitle" },
  { pattern: /^\/companies\/new$/, key: "crud.companies.form.addTitle" },
  { pattern: /^\/companies\/[^/]+\/edit$/, key: "crud.companies.form.editTitle" },
  { pattern: /^\/experiences\/new$/, key: "crud.experiences.form.addTitle" },
  {
    pattern: /^\/experiences\/[^/]+\/edit$/,
    key: "crud.experiences.form.editTitle",
  },
];

export function getStudioPageTitleKey(pathname: string): string {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  for (const rule of DYNAMIC_TITLE_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.key;
    }
  }

  return STATIC_PATH_TITLE_KEYS[normalized] ?? "nav.brand";
}

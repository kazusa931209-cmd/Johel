/** Whole-line or line-start boilerplate patterns (case-insensitive). */
export const boilerplatePatterns: RegExp[] = [
  /^\s*privacy policy\s*$/i,
  /^\s*terms of service\s*$/i,
  /^\s*terms of use\s*$/i,
  /^\s*cookie policy\s*$/i,
  /^\s*contact us\s*$/i,
  /^\s*view more jobs\s*$/i,
  /^\s*see all jobs\s*$/i,
  /^\s*browse jobs\s*$/i,
  /^\s*copyright\b/i,
  /^\s*©\s*\d{4}/i,
  /^\s*all rights reserved\s*$/i,
  /^\s*click apply to view contact details\s*$/i,
  /^\s*contact details appear only after your apply click is recorded\.?\s*$/i,
  /^\s*sign up to apply\s*$/i,
  /^\s*create an account to apply\s*$/i,
];

/**
 * Exact standalone navigation labels (trimmed, case-insensitive).
 * Never apply when the line also matches a protected section phrase.
 */
export const navigationExactLabels: string[] = [
  "job",
  "jobs",
  "talent",
  "enterprise service",
  "investment",
  "home",
  "about",
  "contact",
  "login",
  "log in",
  "sign up",
  "signup",
  "register",
  "find jobs",
  "post a job",
  "find talent",
  "careers",
  "pricing",
  "blog",
  "help",
  "faq",
  "menu",
  "search",
  "svg",
];

/** Phrases that must never be treated as navigation noise. */
export const protectedSectionPhrases: string[] = [
  "job description",
  "job requirements",
  "job responsibilities",
  "responsibilities",
  "requirements",
  "qualifications",
  "skills",
  "benefits",
  "company overview",
  "about the company",
  "about us",
  "salary",
  "location",
  "employment type",
  "work arrangement",
  "cooperation",
];

/** Common job-posting section heading prefixes (case-insensitive). */
export const sectionHeadings: RegExp[] = [
  /^job\s+description\b/i,
  /^job\s+requirements?\b/i,
  /^responsibilities\b/i,
  /^requirements?\b/i,
  /^qualifications?\b/i,
  /^skills?\b/i,
  /^benefits?\b/i,
  /^company\s+overview\b/i,
  /^about\s+the\s+company\b/i,
  /^about\s+us\b/i,
  /^salary\b/i,
  /^location\b/i,
  /^employment\s+type\b/i,
  /^work\s+arrangement\b/i,
  /^cooperation\b/i,
  /^base\b/i,
  /^岗位职责/i,
  /^职位描述/i,
  /^任职要求/i,
  /^专业技能/i,
  /^基本条件/i,
];

/**
 * After the last meaningful section body, trim from these footer markers onward
 * when they appear as near-standalone lines.
 */
export const footerBoundaryPatterns: RegExp[] = [
  /^\s*contact\s+details\s*$/i,
  /^\s*privacy\s+policy\s*$/i,
  /^\s*terms\s+of\s+(service|use)\s*$/i,
  /^\s*copyright\b/i,
  /^\s*©\s*\d{4}/i,
  /^\s*all\s+rights\s+reserved\s*$/i,
  /^\s*similar\s+jobs\s*$/i,
  /^\s*related\s+jobs\s*$/i,
  /^\s*share\s+this\s+job\s*$/i,
];

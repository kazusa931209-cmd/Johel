import type { GeneratedResume } from "@johel/resume";

type PeriodLabel = {
  year: number;
  month: number;
};

export type CareerYearsCompanyPeriod = {
  startDate: string;
  endDate: string;
};

const PRESENT_LABEL = /^present$/i;

const CAREER_YEARS_PATTERNS: Record<string, RegExp> = {
  en: /\+\s*\d+\s*years?\s+of\s+experience/i,
  ko: /\+\s*\d+\s*년\s*(?:이상\s*)?경력/i,
  ja: /\+\s*\d+\s*年(?:以上)?の(?:実務)?経験/i,
  "zh-TW": /\+\s*\d+\s*年(?:以上)?(?:的)?(?:工作)?經驗/i,
  "zh-CN": /\+\s*\d+\s*年(?:以上)?(?:的)?(?:工作)?经验/i,
};

function parsePeriodLabel(label: string): PeriodLabel | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }

  if (PRESENT_LABEL.test(trimmed)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  if (/^\d{4}$/.test(trimmed)) {
    return { year: Number.parseInt(trimmed, 10), month: 1 };
  }

  const parsed = new Date(`${trimmed} 1`);
  if (!Number.isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
  }

  return null;
}

function monthsInPeriod(start: PeriodLabel, end: PeriodLabel): number {
  return Math.max(0, (end.year - start.year) * 12 + (end.month - start.month));
}

export function calculateTotalExperienceYearsFromCompanies(
  companies: readonly CareerYearsCompanyPeriod[],
): number {
  let totalMonths = 0;

  for (const company of companies) {
    const start = parsePeriodLabel(company.startDate);
    const end = parsePeriodLabel(company.endDate);
    if (!start || !end) {
      continue;
    }
    totalMonths += monthsInPeriod(start, end);
  }

  if (totalMonths <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(totalMonths / 12));
}

function formatCareerYearsLead(years: number, language: string): string {
  switch (language) {
    case "ko":
      return `+${years}년 경력`;
    case "ja":
      return `+${years}年の実務経験`;
    case "zh-TW":
      return `+${years}年的工作經驗`;
    case "zh-CN":
      return `+${years}年的工作经验`;
    default:
      return `+${years} years of experience`;
  }
}

function lowercaseFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function summaryAlreadyHasCareerYears(
  summary: string,
  language: string,
): boolean {
  const pattern = CAREER_YEARS_PATTERNS[language] ?? CAREER_YEARS_PATTERNS.en;
  return pattern.test(summary.trim());
}

export function ensureSummaryCareerYears(
  summary: string | undefined,
  totalYears: number,
  language: string,
): string {
  if (totalYears < 1) {
    return summary?.trim() ?? "";
  }

  const body = summary?.trim() ?? "";
  if (body && summaryAlreadyHasCareerYears(body, language)) {
    return body;
  }

  const lead = formatCareerYearsLead(totalYears, language);
  if (!body) {
    return `${lead}.`;
  }

  return `${lead}, ${lowercaseFirst(body)}`;
}

export function finalizeResumeSummaryCareerYears(
  resume: GeneratedResume,
  companies: readonly CareerYearsCompanyPeriod[],
  language: string,
): GeneratedResume {
  const totalYears = calculateTotalExperienceYearsFromCompanies(companies);
  if (totalYears < 1) {
    return resume;
  }

  const summary = ensureSummaryCareerYears(resume.summary, totalYears, language);
  if (summary === resume.summary?.trim()) {
    return resume;
  }

  return {
    ...resume,
    summary,
  };
}

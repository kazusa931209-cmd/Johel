import type { GeneratedResume } from "@johel/resume";
import type { CompanyDetail } from "@/lib/company";

type LinkedCompanyEntry = {
  companyId: string;
  experienceIds: string[];
};

export type CombineReferencedCompany = Pick<
  CompanyDetail,
  "id" | "name" | "alias"
>;

function orderReferencedCompaniesByDraftResume(
  companies: ReadonlyArray<CombineReferencedCompany>,
  resume: GeneratedResume,
): CombineReferencedCompany[] {
  const byResumeCompanyName = new Map<string, CombineReferencedCompany>();
  for (const company of companies) {
    const key = company.name.trim();
    if (!byResumeCompanyName.has(key)) {
      byResumeCompanyName.set(key, company);
    }
  }

  const ordered: CombineReferencedCompany[] = [];
  const seenIds = new Set<string>();

  for (const experience of resume.experiences) {
    const match = byResumeCompanyName.get(experience.company.trim());
    if (!match || seenIds.has(match.id)) continue;
    seenIds.add(match.id);
    ordered.push(match);
  }

  for (const company of companies) {
    if (!seenIds.has(company.id)) {
      ordered.push(company);
    }
  }

  return ordered;
}

/** Companies included on the Combine step for the current generation. */
export function getCombineReferencedCompanies(
  entries: ReadonlyArray<{ companyId: string }>,
  companies: ReadonlyArray<CombineReferencedCompany>,
  resume?: GeneratedResume | null,
): CombineReferencedCompany[] {
  const seen = new Set<string>();
  const byId = new Map(companies.map((company) => [company.id, company]));
  const result: CombineReferencedCompany[] = [];

  for (const entry of entries) {
    if (seen.has(entry.companyId)) continue;
    seen.add(entry.companyId);
    const company = byId.get(entry.companyId);
    if (company) {
      result.push(company);
    }
  }

  if (resume) {
    return orderReferencedCompaniesByDraftResume(result, resume);
  }

  return [...result];
}

export function buildLinkedExperienceCompanyLabels(
  entries: ReadonlyArray<LinkedCompanyEntry>,
  companies: ReadonlyArray<Pick<CompanyDetail, "id" | "name">>,
): ReadonlyMap<string, string> {
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const labelsByExperienceId = new Map<string, string>();

  for (const entry of entries) {
    const company = companyById.get(entry.companyId);
    const companyLabel = company ? company.name : entry.companyId;

    for (const experienceId of entry.experienceIds) {
      const existing = labelsByExperienceId.get(experienceId);
      if (!existing) {
        labelsByExperienceId.set(experienceId, companyLabel);
        continue;
      }
      if (!existing.includes(companyLabel)) {
        labelsByExperienceId.set(
          experienceId,
          `${existing}, ${companyLabel}`,
        );
      }
    }
  }

  return labelsByExperienceId;
}

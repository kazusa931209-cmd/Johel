import type { CompanyDetail } from "@/lib/company";

type LinkedCompanyEntry = {
  companyId: string;
  experienceIds: string[];
};

export type CombineReferencedCompany = Pick<
  CompanyDetail,
  "id" | "name" | "alias"
>;

/** Companies included on the Combine step for the current generation. */
export function getCombineReferencedCompanies(
  entries: ReadonlyArray<{ companyId: string }>,
  companies: ReadonlyArray<CombineReferencedCompany>,
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

  return result.sort((a, b) => a.alias.localeCompare(b.alias));
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

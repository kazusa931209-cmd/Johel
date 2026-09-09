export type CompanyDetail = {
  id: string;
  displayPriority: number;
  alias: string;
  name: string;
  whatCompanyIs: string;
  domainAndStack: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyWritePayload = {
  displayPriority: number;
  alias: string;
  name: string;
  whatCompanyIs: string;
  domainAndStack: string;
};

export function sortCompaniesByDisplayPriority<
  T extends Pick<CompanyDetail, "displayPriority" | "name" | "id">,
>(companies: T[]): T[] {
  return [...companies].sort((a, b) => {
    if (a.displayPriority !== b.displayPriority) {
      return a.displayPriority - b.displayPriority;
    }
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) {
      return byName;
    }
    return a.id.localeCompare(b.id);
  });
}

export function orderCompaniesForCombineDisplay<
  T extends Pick<CompanyDetail, "displayPriority" | "name" | "id">,
>(
  workspaceCompanies: T[],
  includedEntries: ReadonlyArray<{ companyId: string }>,
): T[] {
  if (includedEntries.length === 0) {
    return sortCompaniesByDisplayPriority(workspaceCompanies);
  }

  const workspaceById = new Map(
    workspaceCompanies.map((company) => [company.id, company]),
  );
  const includedIds = new Set(
    includedEntries.map((entry) => entry.companyId),
  );

  const selected = includedEntries
    .map((entry) => workspaceById.get(entry.companyId))
    .filter((company): company is T => Boolean(company));

  const unselected = workspaceCompanies.filter(
    (company) => !includedIds.has(company.id),
  );

  return [...selected, ...sortCompaniesByDisplayPriority(unselected)];
}

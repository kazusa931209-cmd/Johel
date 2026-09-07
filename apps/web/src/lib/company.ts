export type CompanyDetail = {
  id: string;
  alias: string;
  name: string;
  whatCompanyIs: string;
  domainAndStack: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyWritePayload = {
  alias: string;
  name: string;
  whatCompanyIs: string;
  domainAndStack: string;
};

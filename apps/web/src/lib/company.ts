export type CompanyDetail = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyWritePayload = {
  name: string;
  description: string;
};

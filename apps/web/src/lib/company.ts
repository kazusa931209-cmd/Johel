export type CompanyMetadataItem = {
  key: string;
  value: string;
};

export type CompanyDetail = {
  id: string;
  name: string;
  description: string;
  priority: number;
  metadata: CompanyMetadataItem[];
  createdAt: string;
  updatedAt: string;
};

export type CompanyWritePayload = {
  name: string;
  description: string;
  priority: number;
  metadata: CompanyMetadataItem[];
};

export function formatMetadataCell(metadata: CompanyMetadataItem[]) {
  if (metadata.length === 0) return "";
  return metadata.map((item) => item.key).join(", ");
}

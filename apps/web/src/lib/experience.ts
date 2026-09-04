export type ExperienceMetadataItem = {
  key: string;
  value: string;
};

export type ExperienceDetail = {
  id: string;
  category: string;
  description: string;
  metadata: ExperienceMetadataItem[];
  createdAt: string;
  updatedAt: string;
};

export type ExperienceWritePayload = {
  category: string;
  description: string;
  metadata: ExperienceMetadataItem[];
};

export function formatMetadataCell(metadata: ExperienceMetadataItem[]) {
  if (metadata.length === 0) return "";
  return metadata.map((item) => item.key).join(", ");
}

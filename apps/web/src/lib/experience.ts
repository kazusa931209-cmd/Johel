export type ExperienceDetail = {
  id: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceWritePayload = {
  category: string;
  description: string;
};

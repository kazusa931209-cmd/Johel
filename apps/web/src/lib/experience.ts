export type ExperienceDetail = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceWritePayload = {
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

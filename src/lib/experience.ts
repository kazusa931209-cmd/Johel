export type ExperienceDetail = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
  isDense?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceWritePayload = {
  category: string;
  problem: string;
  actions: string;
  outcome: string;
};

/** Revision for experiences linked on the Combine step (content change or removal). */
export function buildLinkedExperienceRevision(
  linkedExperienceIds: string[],
  experiences: ExperienceDetail[],
): string {
  if (linkedExperienceIds.length === 0) {
    return "";
  }

  const byId = new Map(experiences.map((item) => [item.id, item]));
  return linkedExperienceIds
    .map((id) => {
      const item = byId.get(id);
      return item ? `${id}:${item.updatedAt}` : `${id}:missing`;
    })
    .join("\0");
}

export type ExperienceDensityFields = {
  problem: string;
  actions: string;
  outcome: string;
};

export const EXPERIENCE_DENSITY_LIMITS = {
  problem: 4,
  actions: 6,
  outcome: 4,
  total: 14,
} as const;

export type ExperienceDensityStatus = {
  counts: { problem: number; actions: number; outcome: number; total: number };
  exceeded: {
    problem: boolean;
    actions: boolean;
    outcome: boolean;
    total: boolean;
  };
  isDense: boolean;
};

const BULLET_LINE = /^\s*-\s+/;

export function countExperienceBullets(text: string): number {
  if (!text.trim()) {
    return 0;
  }
  return text.split("\n").filter((line) => BULLET_LINE.test(line)).length;
}

export function countExperienceFieldBullets(
  fields: ExperienceDensityFields,
): { problem: number; actions: number; outcome: number; total: number } {
  const problem = countExperienceBullets(fields.problem);
  const actions = countExperienceBullets(fields.actions);
  const outcome = countExperienceBullets(fields.outcome);
  return {
    problem,
    actions,
    outcome,
    total: problem + actions + outcome,
  };
}

export function getExperienceDensityStatus(
  fields: ExperienceDensityFields,
): ExperienceDensityStatus {
  const counts = countExperienceFieldBullets(fields);
  const limits = EXPERIENCE_DENSITY_LIMITS;
  const exceeded = {
    problem: counts.problem > limits.problem,
    actions: counts.actions > limits.actions,
    outcome: counts.outcome > limits.outcome,
    total: counts.total > limits.total,
  };
  return {
    counts,
    exceeded,
    isDense:
      exceeded.problem ||
      exceeded.actions ||
      exceeded.outcome ||
      exceeded.total,
  };
}

export function isDenseExperience(fields: ExperienceDensityFields): boolean {
  return getExperienceDensityStatus(fields).isDense;
}

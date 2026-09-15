import { z } from "zod";

const combineCompanySchema = z.object({
  experienceIds: z.array(z.string()).default([]),
});

const combineSchema = z.object({
  companies: z.array(combineCompanySchema).default([]),
});

/** Collects all experience IDs linked in a generation combine snapshot. */
export function extractLinkedExperienceIds(combineJson: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(combineJson);
  } catch {
    return [];
  }

  const combine = combineSchema.safeParse(parsed);
  if (!combine.success) {
    return [];
  }

  const linked = new Set<string>();
  for (const company of combine.data.companies) {
    for (const id of company.experienceIds) {
      const trimmed = id.trim();
      if (trimmed) {
        linked.add(trimmed);
      }
    }
  }

  return [...linked];
}

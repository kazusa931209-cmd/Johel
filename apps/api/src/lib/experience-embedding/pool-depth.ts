export const EXPERIENCE_ADVISE_POOL_DEPTHS = [
  "compact",
  "normal",
  "thorough",
  "full",
] as const;

export type ExperienceAdvisePoolDepth =
  (typeof EXPERIENCE_ADVISE_POOL_DEPTHS)[number];

export const DEFAULT_EXPERIENCE_ADVISE_POOL_DEPTH: ExperienceAdvisePoolDepth =
  "normal";

const FULL_STAR_K_BY_DEPTH: Record<
  Exclude<ExperienceAdvisePoolDepth, "full">,
  number
> = {
  compact: 5,
  normal: 10,
  thorough: 25,
};

export function isExperienceAdvisePoolDepth(
  value: string,
): value is ExperienceAdvisePoolDepth {
  return (EXPERIENCE_ADVISE_POOL_DEPTHS as readonly string[]).includes(value);
}

export function resolveExperienceAdviseFullStarK(
  depth: ExperienceAdvisePoolDepth,
): number | null {
  if (depth === "full") {
    return null;
  }
  return FULL_STAR_K_BY_DEPTH[depth];
}

export function normalizeExperienceAdvisePoolDepth(
  value: string | null | undefined,
): ExperienceAdvisePoolDepth {
  if (value && isExperienceAdvisePoolDepth(value)) {
    return value;
  }
  return DEFAULT_EXPERIENCE_ADVISE_POOL_DEPTH;
}

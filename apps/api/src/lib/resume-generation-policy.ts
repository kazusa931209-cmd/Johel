export const EXPERIENCE_DIMENSION_MODES = [
  "star_axis",
  "jd_signal",
  "technical_facet",
  "problem_item",
] as const;

export type ExperienceDimensionMode = (typeof EXPERIENCE_DIMENSION_MODES)[number];

export const DEFAULT_EXPERIENCE_DIMENSION_MODE: ExperienceDimensionMode =
  "technical_facet";

export const EXPERIENCE_JD_TIER_DECAY_PERCENTS = [30, 50, 70, 80] as const;

export type ExperienceJdTierDecayPercent =
  (typeof EXPERIENCE_JD_TIER_DECAY_PERCENTS)[number];

export const DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT: ExperienceJdTierDecayPercent =
  80;

const DIMENSION_MODE_LABELS: Record<ExperienceDimensionMode, string> = {
  star_axis: "STAR axis (problem / actions / outcome)",
  jd_signal: "JD signal (different rubric items per company)",
  technical_facet: "Technical facet (scale / reliability / security / cost)",
  problem_item: "Problem item (distinct Problem bullet items)",
};

/** index 0 = first in combine.companies (selection order) */
export function computeJdTierWeight(
  companyIndex: number,
  decayPercent: number = DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
): number {
  if (companyIndex < 0) {
    return 1;
  }
  return (decayPercent / 100) ** companyIndex;
}

export function formatJdTierPercent(weight: number): string {
  const percent = Math.round(weight * 100);
  return `${percent}%`;
}

export function formatJdTierOrderRule(
  decayPercent: number,
  companyCount = 3,
): string {
  const parts: string[] = [];
  for (let index = 0; index < companyCount; index += 1) {
    parts.push(
      `index ${index + 1} = ${formatJdTierPercent(computeJdTierWeight(index, decayPercent))}`,
    );
  }
  return `${parts.join(", ")}, …`;
}

export function normalizeExperienceDimensionMode(
  value: string | null | undefined,
): ExperienceDimensionMode {
  if (
    value &&
    EXPERIENCE_DIMENSION_MODES.includes(value as ExperienceDimensionMode)
  ) {
    return value as ExperienceDimensionMode;
  }
  return DEFAULT_EXPERIENCE_DIMENSION_MODE;
}

export function normalizeExperienceJdTierDecayPercent(
  value: number | null | undefined,
): ExperienceJdTierDecayPercent {
  if (
    value != null &&
    EXPERIENCE_JD_TIER_DECAY_PERCENTS.includes(
      value as ExperienceJdTierDecayPercent,
    )
  ) {
    return value as ExperienceJdTierDecayPercent;
  }
  return DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT;
}

export function getExperienceDimensionModeLabel(
  mode: ExperienceDimensionMode,
): string {
  return DIMENSION_MODE_LABELS[mode];
}

export function getDimensionModePromptText(mode: ExperienceDimensionMode): string {
  switch (mode) {
    case "star_axis":
      return "When the same capability (category) appears at multiple companies, emphasize a different STAR axis per company: one company foregrounds the problem/situation, another the actions/methods, another the outcome/impact. Do not repeat the same axis framing across companies.";
    case "jd_signal":
      return "When the same capability (category) appears at multiple companies, map each company to a different JD rubric signal (Top Hiring Signals, Technical Requirements, Critical JD Terminology). Do not repeat the same JD signal emphasis across companies.";
    case "technical_facet":
      return "When the same capability (category) appears at multiple companies, emphasize a different technical facet per company (for example scale, reliability, security, cost, latency, operability). Do not repeat the same facet across companies.";
    case "problem_item":
      return "When the same capability (category) appears at multiple companies, foreground a different Problem bullet item or failure mode per company. Do not repeat the same problem framing across companies.";
  }
}

export function getCompanySceneCombineRules(): string {
  return `- Company scene fit: link cards only when the work plausibly fits the employer's \`whatCompanyIs\`. Do not link cards whose industry or domain clearly contradicts the company scene (for example genomics/Illumina ingestion for a retail SaaS employer unless the company scene explicitly covers that domain).
- When JD overlap would require a scene-mismatched card, prefer role-context-authentic, scene-fit cards from the index instead; add a warning when no scene-fit card matches the JD slot.`;
}

export function getCompanySceneGenerateRules(): string {
  return `- Company scene grounding: bullets under each company must read as work in that employer's industry/product domain (\`whatCompanyIs\`). Frame each linked card's STAR facts with company-scene wording.
- Do not surface niche domain vocabulary from a linked card when it contradicts the company scene. Reframe the underlying capability using the employer's domain (for example retail-operations data ingestion instead of Illumina probes, rsIDs, or allele encodings when the employer is a retail SaaS platform).
- Do not invent employer-specific products, customers, or metrics not supported by that card's \`actions\` or \`outcome\`.`;
}

export function getJdTierCombineRules(
  decayPercent: number = DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
): string {
  const tierOrder = formatJdTierOrderRule(decayPercent);
  return `- Priority stack (per company): (1) Company scene fit — never link cards that contradict \`whatCompanyIs\`; (2) Role context caps JD selection — never pick cards that exceed what the role context allows; (3) JD tier by resume selection order (${tierOrder}); (4) Keyword context steers within that company's slot and keyword influence scales with the tier.
- JD selection weight (Combine): aim for roughly that percentage of selected cards to have strong JD overlap; fill the remainder with role-context-authentic cards from the index.
- Keyword context: when provided, prioritize keyword-matching cards within the company's JD/keyword budget; keyword steering intensity also scales with the tier.
- Cross-company dimension: when the same capability category would appear at multiple companies, prefer cards that emphasize different dimensions per the configured dimension mode.`;
}

export function getJdTierGenerateRules(
  decayPercent: number = DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
): string {
  const tierOrder = formatJdTierOrderRule(decayPercent);
  return `- Summary and Skills: use the full JD rubric (100% tailoring).
- Experience bullets only: tier JD terminology and rubric mapping by company selection order (${tierOrder}). Lower tiers stay grounded in role context and STAR materials with reduced JD keyword density; keep bullets coherent with the resume narrative rather than unrelated to both JD and materials.
- Priority stack (per company Experience block): (1) Company scene grounding — bullets must fit \`whatCompanyIs\`; (2) Role context caps JD tailoring — do not write bullets that exceed what role context allows; (3) JD tier decay (${decayPercent}% per step); (4) Keyword context steers within the slot and keyword steering intensity scales with the tier.
- Cross-company dimension: when the same capability appears at multiple companies, emphasize different dimensions per the configured dimension mode; do not repeat the same framing.`;
}

export type CompanyTierContext = {
  resumeOrderIndex: number;
  jdTierWeight: number;
  jdTierPercent: string;
};

export function buildCompanyTierContext(
  companyIndex: number,
  decayPercent: number = DEFAULT_EXPERIENCE_JD_TIER_DECAY_PERCENT,
): CompanyTierContext {
  const jdTierWeight = computeJdTierWeight(companyIndex, decayPercent);
  return {
    resumeOrderIndex: companyIndex + 1,
    jdTierWeight,
    jdTierPercent: formatJdTierPercent(jdTierWeight),
  };
}

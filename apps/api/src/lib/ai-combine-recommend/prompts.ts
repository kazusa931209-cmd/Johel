import {
  resolveCombineExperiencesPerCompanyRange,
} from "../combine-experiences-per-company.js";
import {
  getCompanySceneCombineRules,
  getDimensionModePromptText,
  getExperienceDimensionModeLabel,
  getJdTierCombineRules,
  type ExperienceDimensionMode,
} from "../resume-generation-policy.js";
import type { CombineRecommendRunCompany } from "./types.js";
import { buildCombineRecommendRefMaps } from "./refs.js";

const JSON_SCHEMA = `{
  "companies": [
    {
      "companyRef": "C01",
      "experienceRefs": ["E01", "E03"],
      "rationale": "string"
    }
  ],
  "warnings": ["string"]
}`;

function buildSharedRules(
  maxPerCompany: number,
  experienceDimensionMode: ExperienceDimensionMode,
  decayPercent: number,
): string {
  const { minPerCompany, maxPerCompany: max, thinOverlapMaxPerCompany } =
    resolveCombineExperiencesPerCompanyRange(maxPerCompany);

  const pickRule =
    minPerCompany === max
      ? `- Pick ${max} experience card${max === 1 ? "" : "s"} per company when possible; fewer only when the JD has little overlap.`
      : `- Pick ${minPerCompany}–${max} experience cards per company when possible; fewer only when the JD has little overlap.`;

  const thinOverlapRule =
    thinOverlapMaxPerCompany === 1
      ? "- When Keyword context is provided but job overlap is thin (keywords match cards but the JD does not strongly support them), select only 1 card for that company and add a warning about keyword/JD mismatch or thin overlap."
      : `- When Keyword context is provided but job overlap is thin (keywords match cards but the JD does not strongly support them), select only 1–${thinOverlapMaxPerCompany} cards for that company—not the usual ${minPerCompany === max ? max : `${minPerCompany}–${max}`}—and add a warning about keyword/JD mismatch or thin overlap.`;

  return `You are an AI Combine advisor for JoHEL resume generation.

Given job context, a profile, company entries (with employment period, role context, optional keyword context, and JD selection weight), and an experience index, recommend which experience cards to link to each company for this run.

Rules:
${pickRule}
- Do not link stack variants of the same capability to the same company (e.g. NestJS and Go twins for the same story).
- Only use companyRef and experienceRef tokens exactly as shown in the index (e.g. C01, E02). Do not invent refs.
${getJdTierCombineRules(decayPercent)}
${getCompanySceneCombineRules()}
- Dimension mode (${getExperienceDimensionModeLabel(experienceDimensionMode)}): ${getDimensionModePromptText(experienceDimensionMode)}
- Per company: if Keyword context is provided, prioritize experience cards that match those keywords (category and problem text) within that company's JD/keyword budget. Keyword steering intensity scales with the company's JD selection weight.
- Per company: if Keyword context is empty or "(none)", choose the best set from the full index using job context and that company's role context only (Auto), respecting the JD selection weight.
${thinOverlapRule}
- warnings: note stack-variant conflicts, empty selections, keyword/JD mismatches, thin overlap, or role-context cap conflicts.

Return ONLY valid JSON matching the schema. Do NOT wrap in a code fence.

Schema:
${JSON_SCHEMA}`;
}

export function getCombineRecommendSystemPrompt(
  maxPerCompany = 5,
  experienceDimensionMode: ExperienceDimensionMode = "technical_facet",
  decayPercent = 80,
): string {
  return `${buildSharedRules(maxPerCompany, experienceDimensionMode, decayPercent)}\n\nProvider notes (OpenAI): Return ONLY valid JSON.`;
}

function formatKeywordContext(keywordContext?: string): string {
  const trimmed = keywordContext?.trim();
  return trimmed
    ? trimmed
    : "(none — match from job context only)";
}

export type CombineRecommendPromptInput = {
  profileId: string;
  jobDescription: string;
  acceptedMarkdown?: string;
  experienceDimensionMode: ExperienceDimensionMode;
  experienceIndex: Array<{
    id: string;
    category: string;
    problemSummary: string;
  }>;
  companies: CombineRecommendRunCompany[];
};

export function buildCombineRecommendUserPrompt(
  input: CombineRecommendPromptInput,
): string {
  const refMaps = buildCombineRecommendRefMaps({
    experienceIds: input.experienceIndex.map((item) => item.id),
    companyIds: input.companies.map((item) => item.companyId),
  });

  const experienceRefById = new Map<string, string>();
  for (const [ref, id] of refMaps.experienceRefToId) {
    experienceRefById.set(id, ref);
  }

  const companyRefById = new Map<string, string>();
  for (const [ref, id] of refMaps.companyRefToId) {
    companyRefById.set(id, ref);
  }

  const jobBlock = input.acceptedMarkdown?.trim()
    ? `## Job context (Verdict)\n\n${input.acceptedMarkdown.trim()}`
    : `## Job context\n\n${input.jobDescription.trim()}`;

  const indexBlock = input.experienceIndex.length
    ? input.experienceIndex
        .map(
          (item) =>
            `- [${experienceRefById.get(item.id)}] ${item.category} — ${item.problemSummary.slice(0, 200)}`,
        )
        .join("\n")
    : "(no experiences)";

  const companiesBlock = input.companies
    .map(
      (company) =>
        `### ${company.name} [${companyRefById.get(company.companyId)}]\nResume order index: ${company.resumeOrderIndex} (1 = first selected)\nJD selection weight: ${company.jdTierPercent}\nDimension mode: ${getExperienceDimensionModeLabel(input.experienceDimensionMode)}\nPeriod: ${company.startDate} – ${company.endDate}\nRole context: ${company.roleContext}\nKeyword context: ${formatKeywordContext(company.keywordContext)}\nWhat this company is:\n${company.whatCompanyIs.trim()}`,
    )
    .join("\n\n");

  const lines = [
    `Profile id: ${input.profileId}`,
    "",
    jobBlock,
    "",
    "## Experience index (use experienceRefs from this list)",
    indexBlock,
    "",
    "## Company entries (use companyRef from this list)",
    companiesBlock,
    "",
    "Respond with a JSON object only (schema in instructions). Do not wrap in a code fence.",
  ];

  return lines.join("\n");
}

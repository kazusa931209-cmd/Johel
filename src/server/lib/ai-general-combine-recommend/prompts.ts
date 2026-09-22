import {
  resolveCombineExperiencesPerCompanyRange,
} from "../combine-experiences-per-company";
import {
  getCompanySceneCombineRules,
  getDimensionModePromptText,
  getExperienceDimensionModeLabel,
  type ExperienceDimensionMode,
} from "../resume-generation-policy";
import type { CombineRecommendRunCompany } from "../ai-combine-recommend/types";
import { buildCombineRecommendRefMaps } from "../ai-combine-recommend/refs";

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
): string {
  const { minPerCompany, maxPerCompany: max, thinOverlapMaxPerCompany } =
    resolveCombineExperiencesPerCompanyRange(maxPerCompany);

  const pickRule =
    minPerCompany === max
      ? `- Pick ${max} experience card${max === 1 ? "" : "s"} per company when possible; fewer only when overlap with the user instruction is thin.`
      : `- Pick ${minPerCompany}–${max} experience cards per company when possible; fewer only when overlap is thin.`;

  const thinOverlapRule =
    thinOverlapMaxPerCompany === 1
      ? "- When Keyword context is provided but instruction overlap is thin, select only 1 card for that company and add a warning."
      : `- When Keyword context is provided but instruction overlap is thin, select only 1–${thinOverlapMaxPerCompany} cards for that company and add a warning.`;

  return `You are an AI Combine advisor for JoHEL **General Resume** (no Job Description).

Given the user's instruction for this run, a profile, company entries (employment period, role context, optional keyword context), and an experience index, recommend which experience cards to link to each company.

Rules:
${pickRule}
- Follow the user instruction strongly when choosing cards and rationale.
- Do not link stack variants of the same capability to the same company.
- Only use companyRef and experienceRef tokens exactly as shown in the index.
${getCompanySceneCombineRules()}
- Dimension mode (${getExperienceDimensionModeLabel(experienceDimensionMode)}): ${getDimensionModePromptText(experienceDimensionMode)}
- Per company: if Keyword context is provided, prioritize cards matching those keywords within that company's slot.
- Per company: if Keyword context is empty, choose from the full index using the user instruction and role context (Auto).
${thinOverlapRule}
- warnings: note conflicts, empty selections, or thin overlap.

Return ONLY valid JSON matching the schema. Do NOT wrap in a code fence.

Schema:
${JSON_SCHEMA}`;
}

export function getGeneralCombineRecommendSystemPrompt(
  maxPerCompany = 5,
  experienceDimensionMode: ExperienceDimensionMode = "technical_facet",
): string {
  return `${buildSharedRules(maxPerCompany, experienceDimensionMode)}\n\nProvider notes (OpenAI): Return ONLY valid JSON.`;
}

function formatKeywordContext(keywordContext?: string): string {
  const trimmed = keywordContext?.trim();
  return trimmed
    ? trimmed
    : "(none — match from user instruction and role context)";
}

export type GeneralCombineRecommendPromptInput = {
  profileId: string;
  userInstruction: string;
  experienceDimensionMode: ExperienceDimensionMode;
  experienceIndex: Array<{
    id: string;
    category: string;
    problemSummary: string;
  }>;
  companies: CombineRecommendRunCompany[];
};

export function buildGeneralCombineRecommendUserPrompt(
  input: GeneralCombineRecommendPromptInput,
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

  const instructionBlock =
    input.userInstruction.trim() ||
    "(none — use role context and keyword context per company)";

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
        `### ${company.name} [${companyRefById.get(company.companyId)}]\nResume order index: ${company.resumeOrderIndex}\nDimension mode: ${getExperienceDimensionModeLabel(input.experienceDimensionMode)}\nPeriod: ${company.startDate} – ${company.endDate}\nRole context: ${company.roleContext}\nKeyword context: ${formatKeywordContext(company.keywordContext)}\nWhat this company is:\n${company.whatCompanyIs.trim()}`,
    )
    .join("\n\n");

  return [
    `Profile id: ${input.profileId}`,
    "",
    "## User instruction",
    instructionBlock,
    "",
    "## Experience index (use experienceRefs from this list)",
    indexBlock,
    "",
    "## Company entries (use companyRef from this list)",
    companiesBlock,
    "",
    "Respond with a JSON object only (schema in instructions). Do not wrap in a code fence.",
  ].join("\n");
}

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

const SHARED_RULES = `You are an AI Combine advisor for JoHEL resume generation.

Given job context, a profile, company entries (with employment period, role context, and optional keyword context), and an experience index, recommend which experience cards to link to each company for this run.

Rules:
- Pick 2–5 experience cards per company when possible; fewer only when the JD has little overlap.
- Do not link stack variants of the same capability to the same company (e.g. NestJS and Go twins for the same story).
- Only use companyRef and experienceRef tokens exactly as shown in the index (e.g. C01, E02). Do not invent refs.
- Per company: if Keyword context is provided, prioritize experience cards that match those keywords (category and problem text) while still fitting the job context and that company's role context. Keywords steer emphasis; the JD still constrains relevance.
- Per company: if Keyword context is empty or "(none)", choose the best set from the full index using job context and that company's role context only (Auto).
- When Keyword context is provided but job overlap is thin (keywords match cards but the JD does not strongly support them), select only 1–2 cards for that company—not the usual 2–5—and add a warning about keyword/JD mismatch or thin overlap.
- warnings: note stack-variant conflicts, empty selections, keyword/JD mismatches, or thin overlap.

Return ONLY valid JSON matching the schema. Do NOT wrap in a code fence.

Schema:
${JSON_SCHEMA}`;

export function getCombineRecommendSystemPrompt(): string {
  return `${SHARED_RULES}\n\nProvider notes (OpenAI): Return ONLY valid JSON.`;
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
        `### ${company.name} [${companyRefById.get(company.companyId)}]\nPeriod: ${company.startDate} – ${company.endDate}\nRole context: ${company.roleContext}\nKeyword context: ${formatKeywordContext(company.keywordContext)}`,
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

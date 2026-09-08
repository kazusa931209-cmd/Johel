import type { AiProviderId } from "../ai-provider.js";
import type { CombineRecommendRequest } from "./types.js";

const JSON_SCHEMA = `{
  "companies": [
    {
      "companyId": "string",
      "experienceIds": ["string"],
      "rationale": "string"
    }
  ],
  "warnings": ["string"]
}`;

const SHARED_RULES = `You are an AI Combine advisor for JoHEL resume generation.

Given job context, a profile, company entries (with employment period and role context), and an experience index, recommend which experience cards to link to each company for this run.

Rules:
- Pick 2–5 experience cards per company when possible; fewer only when the JD has little overlap.
- Do not link stack variants of the same capability to the same company (e.g. NestJS and Go twins for the same story).
- Only use experience ids from the index.
- In guided mode, keep user seed experienceIds and add/remove only when the JD supports it.
- In auto mode, choose the best set per company from the full index.
- Do not invent experience ids.
- warnings: note stack-variant conflicts, empty selections, or thin JD overlap.

Return ONLY valid JSON matching the schema. Do NOT wrap in a code fence.

Schema:
${JSON_SCHEMA}`;

export function getCombineRecommendSystemPrompt(provider: AiProviderId): string {
  const notes =
    provider === "cursor"
      ? "Provider notes (Cursor): Return ONLY valid JSON."
      : "Provider notes (OpenAI): Return ONLY valid JSON.";
  return `${SHARED_RULES}\n\n${notes}`;
}

export function buildCombineRecommendUserPrompt(
  input: CombineRecommendRequest & {
    experienceIndex: Array<{
      id: string;
      category: string;
      problemSummary: string;
    }>;
    companies: Array<{
      companyId: string;
      name: string;
      startDate: string;
      endDate: string;
      roleContext: string;
      seedExperienceIds: string[];
    }>;
  },
): string {
  const jobBlock = input.acceptedMarkdown?.trim()
    ? `## Job context (Verdict)\n\n${input.acceptedMarkdown.trim()}`
    : `## Job context\n\n${input.jobDescription.trim()}`;

  const indexBlock = input.experienceIndex.length
    ? input.experienceIndex
        .map(
          (item) =>
            `- ${item.id}: ${item.category} — ${item.problemSummary.slice(0, 200)}`,
        )
        .join("\n")
    : "(no experiences)";

  const companiesBlock = input.companies
    .map(
      (company) =>
        `### ${company.name} (${company.companyId})\nPeriod: ${company.startDate} – ${company.endDate}\nRole context: ${company.roleContext}\nSeed experience ids: ${company.seedExperienceIds.join(", ") || "(none)"}`,
    )
    .join("\n\n");

  return [
    `Mode: **${input.mode}**`,
    `Profile id: ${input.profileId}`,
    "",
    jobBlock,
    "",
    "## Experience index",
    indexBlock,
    "",
    "## Company entries",
    companiesBlock,
  ].join("\n");
}

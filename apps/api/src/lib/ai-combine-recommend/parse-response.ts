import { z } from "zod";
import type { CombineRecommendResult } from "./types.js";

const responseSchema = z.object({
  companies: z
    .array(
      z.object({
        companyId: z.string().trim().min(1),
        experienceIds: z.array(z.string().trim().min(1)),
        rationale: z.string().trim().min(1),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
});

export function parseCombineRecommendResponse(
  raw: string,
  allowedExperienceIds: Set<string>,
  allowedCompanyIds: Set<string>,
):
  | { success: true; result: CombineRecommendResult }
  | { success: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: "AI returned an empty response." };
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "AI response was not valid JSON." };
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      success: false,
      error: "AI response did not match the Combine recommend schema.",
    };
  }

  for (const company of parsed.data.companies) {
    if (!allowedCompanyIds.has(company.companyId)) {
      return {
        success: false,
        error: `Unknown companyId in response: ${company.companyId}`,
      };
    }
    for (const experienceId of company.experienceIds) {
      if (!allowedExperienceIds.has(experienceId)) {
        return {
          success: false,
          error: `Unknown experienceId in response: ${experienceId}`,
        };
      }
    }
  }

  return {
    success: true,
    result: {
      companies: parsed.data.companies,
      warnings: parsed.data.warnings,
    },
  };
}

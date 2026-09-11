import { z } from "zod";
import { normalizeCombineExperiencesPerCompanyMax } from "../combine-experiences-per-company.js";
import {
  dedupePreservingOrder,
  resolveCompanyRef,
  resolveExperienceRef,
  type RefMaps,
} from "./refs.js";
import type { CombineRecommendResult } from "./types.js";

const responseSchema = z.object({
  companies: z
    .array(
      z.object({
        companyRef: z.string().trim().min(1),
        experienceRefs: z.array(z.string().trim().min(1)),
        rationale: z.string().trim().min(1),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
});

export function parseCombineRecommendResponse(
  raw: string,
  refMaps: RefMaps,
  maxExperiencesPerCompany?: number,
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

  const companies: CombineRecommendResult["companies"] = [];
  const perCompanyMax = normalizeCombineExperiencesPerCompanyMax(
    maxExperiencesPerCompany,
  );

  for (const company of parsed.data.companies) {
    const companyId = resolveCompanyRef(
      company.companyRef,
      refMaps.companyRefToId,
      refMaps.companyRefWidth,
    );
    if (!companyId) {
      return {
        success: false,
        error: `Unknown companyRef in response: ${company.companyRef}`,
      };
    }

    const experienceIds: string[] = [];
    for (const experienceRef of company.experienceRefs) {
      const experienceId = resolveExperienceRef(
        experienceRef,
        refMaps.experienceRefToId,
        refMaps.experienceRefWidth,
      );
      if (!experienceId) {
        return {
          success: false,
          error: `Unknown experienceRef in response: ${experienceRef}`,
        };
      }
      experienceIds.push(experienceId);
    }

    companies.push({
      companyId,
      experienceIds: dedupePreservingOrder(experienceIds).slice(0, perCompanyMax),
      rationale: company.rationale,
    });
  }

  return {
    success: true,
    result: {
      companies,
      warnings: parsed.data.warnings,
    },
  };
}

import { z } from "zod";

const combineCompanySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  keywordContext: z.string().optional(),
  experienceIds: z.array(z.string()).default([]),
});

const combineSchema = z.object({
  profileId: z.string().trim().min(1),
  userInstruction: z.string().optional(),
  platform: z.string().optional(),
  companies: z.array(combineCompanySchema).min(1),
});

export type LoadedGeneralCombineRecommendInput = {
  profileId: string;
  userInstruction: string;
  platform: string;
  companies: Array<{
    companyId: string;
    startDate: string;
    endDate: string;
    roleContext: string;
    keywordContext?: string;
  }>;
};

export function loadGeneralCombineRecommendInputFromGeneration(generation: {
  combineJson: string;
}):
  | { success: true; input: LoadedGeneralCombineRecommendInput }
  | { success: false; error: string } {
  let combineJson: unknown;
  try {
    combineJson = JSON.parse(generation.combineJson);
  } catch {
    return { success: false, error: "Combine snapshot is invalid." };
  }

  const combine = combineSchema.safeParse(combineJson);
  if (!combine.success) {
    return {
      success: false,
      error: "Complete Combine (profile and companies) before suggesting.",
    };
  }

  return {
    success: true,
    input: {
      profileId: combine.data.profileId,
      userInstruction: combine.data.userInstruction?.trim() ?? "",
      platform: combine.data.platform?.trim() ?? "",
      companies: combine.data.companies.map((company) => ({
        companyId: company.companyId,
        startDate: company.startDate,
        endDate: company.endDate,
        roleContext: company.roleContext,
        keywordContext: company.keywordContext,
      })),
    },
  };
}

import { z } from "zod";

const JOB_TEXT_MAX = 10_000;

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
  companies: z.array(combineCompanySchema).min(1),
});

const jobSchema = z.object({
  jobText: z.string().optional(),
  filteredJobText: z.string().optional(),
});

export type LoadedCombineRecommendInput = {
  profileId: string;
  jobDescription: string;
  acceptedMarkdown?: string;
  companies: Array<{
    companyId: string;
    startDate: string;
    endDate: string;
    roleContext: string;
    keywordContext?: string;
  }>;
};

export type LoadedGenerationRow = {
  doVerdict: boolean;
  jobJson: string;
  combineJson: string;
  verdictMarkdown: string | null;
};

function readJobDescription(jobJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jobJson);
  } catch {
    return null;
  }

  const job = jobSchema.safeParse(parsed);
  if (!job.success) {
    return null;
  }

  const filtered = job.data.filteredJobText?.trim();
  if (filtered) {
    return filtered.slice(0, JOB_TEXT_MAX);
  }

  const raw = job.data.jobText?.trim();
  return raw ? raw.slice(0, JOB_TEXT_MAX) : null;
}

export function loadCombineRecommendInputFromGeneration(
  generation: LoadedGenerationRow,
):
  | { success: true; input: LoadedCombineRecommendInput }
  | { success: false; error: string } {
  const jobDescription = readJobDescription(generation.jobJson);
  if (!jobDescription) {
    return {
      success: false,
      error: "Job Description is required before suggesting experiences.",
    };
  }

  let combineJson: unknown;
  try {
    combineJson = JSON.parse(generation.combineJson);
  } catch {
    return {
      success: false,
      error: "Combine selection is invalid. Save the generation and try again.",
    };
  }

  const combine = combineSchema.safeParse(combineJson);
  if (!combine.success) {
    return {
      success: false,
      error: "Combine selection is incomplete. Choose a profile and companies first.",
    };
  }

  if (generation.doVerdict && !generation.verdictMarkdown?.trim()) {
    return {
      success: false,
      error: "Complete the Verdict step before suggesting experiences.",
    };
  }

  return {
    success: true,
    input: {
      profileId: combine.data.profileId,
      jobDescription,
      acceptedMarkdown: generation.doVerdict
        ? generation.verdictMarkdown?.trim()
        : undefined,
      companies: combine.data.companies.map((entry) => ({
        companyId: entry.companyId,
        startDate: entry.startDate,
        endDate: entry.endDate,
        roleContext: entry.roleContext,
        keywordContext: entry.keywordContext?.trim(),
      })),
    },
  };
}

import {
  assembleFromCombineSnapshot,
  type CombineSnapshot,
} from "./assemble-input";
import type { ResumeGenerationInput } from "../ai-resume/types";
import {
  normalizeExperienceDimensionMode,
  normalizeExperienceJdTierDecayPercent,
} from "../resume-generation-policy";
import { prisma } from "../prisma";

export type GeneralCombineSnapshot = CombineSnapshot & {
  userInstruction?: string;
  platform?: string;
};

type AssembleGeneralParams = {
  userId: string;
  combine: GeneralCombineSnapshot;
};

export async function assembleGeneralResumeGenerationInput(
  params: AssembleGeneralParams,
): Promise<ResumeGenerationInput> {
  const { userId, combine } = params;

  const generationProcess = await prisma.generationProcess.findUnique({
    where: { userId },
  });

  const base = await assembleFromCombineSnapshot({
    userId,
    jobContext: "",
    combine,
  });

  return {
    ...base,
    run: {
      ...base.run,
      userInstruction: combine.userInstruction?.trim() ?? "",
      platform: combine.platform?.trim() ?? "",
    },
    generationPolicy: {
      experienceDimensionMode: normalizeExperienceDimensionMode(
        generationProcess?.experienceDimensionMode,
      ),
      experienceJdTierDecayPercent: normalizeExperienceJdTierDecayPercent(
        generationProcess?.experienceJdTierDecayPercent,
      ),
    },
  };
}

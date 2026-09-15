import type { AssembledResumeGenerationInput } from "../ai-resume/types.js";
import {
  assembleFromCombineSnapshot,
  type CombineSnapshot,
} from "./assemble-input.js";

export function combineContentFingerprintFromInput(
  input: Pick<AssembledResumeGenerationInput, "profile" | "companies" | "run">,
): string {
  return JSON.stringify({
    profile: input.profile,
    companies: input.companies,
    run: input.run,
  });
}

export async function buildCombineGenerationFingerprint(
  userId: string,
  combine: CombineSnapshot,
): Promise<string> {
  const assembled = await assembleFromCombineSnapshot({
    userId,
    combine,
    jobContext: "",
  });
  return combineContentFingerprintFromInput(assembled);
}

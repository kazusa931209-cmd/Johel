import { z } from "zod";
import type {
  CheckOnExperiencesParsedResponse,
  CheckOnExperiencesVerdict,
} from "./types";

const responseSchema = z.object({
  verdict: z.enum([
    "gap_confirmed",
    "exists_not_linked",
    "exists_and_linked",
  ]),
  matchedExperienceIds: z.array(z.string()).default([]),
  explanation: z.string().trim().min(1),
});

export function parseCheckOnExperiencesResponse(
  outputText: string,
  hasGenerationContext: boolean,
): CheckOnExperiencesParsedResponse {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned invalid JSON for check on experiences.");
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("OpenAI returned invalid check on experiences shape.");
  }

  let verdict: CheckOnExperiencesVerdict = parsed.data.verdict;
  if (!hasGenerationContext && verdict === "exists_and_linked") {
    verdict = "exists_not_linked";
  }

  const matchedExperienceIds = parsed.data.matchedExperienceIds
    .map((id) => id.trim())
    .filter(Boolean);

  return {
    verdict,
    matchedExperienceIds,
    explanation: parsed.data.explanation.trim(),
  };
}

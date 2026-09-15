import { z } from "zod";
import type { CheckGapsParsedResponse, CheckGapsVerdict } from "./types.js";

const responseSchema = z.object({
  verdict: z.enum([
    "gap_confirmed",
    "exists_not_linked",
    "exists_and_linked",
  ]),
  matchedExperienceIds: z.array(z.string()).default([]),
  explanation: z.string().trim().min(1),
});

export function parseCheckGapsResponse(
  outputText: string,
  hasGenerationContext: boolean,
): CheckGapsParsedResponse {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned invalid JSON for gap check.");
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("OpenAI returned invalid gap check shape.");
  }

  let verdict: CheckGapsVerdict = parsed.data.verdict;
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

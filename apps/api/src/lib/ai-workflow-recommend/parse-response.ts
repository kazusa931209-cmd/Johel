import { z } from "zod";
import type { WorkflowRecommendMatch } from "./types.js";

const matchSchema = z.object({
  workflowId: z.string().trim().min(1),
  score: z.number().finite().min(0).max(100),
});

const responseSchema = z.object({
  matches: z.array(matchSchema),
});

export function parseWorkflowRecommendResponse(
  raw: string,
): { success: true; matches: WorkflowRecommendMatch[] } | { success: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: "AI returned an empty response." };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(trimmed);
  } catch {
    return { success: false, error: "AI response was not valid JSON." };
  }

  const parsed = responseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      success: false,
      error: "AI response did not match the required workflow recommendation schema.",
    };
  }

  return { success: true, matches: parsed.data.matches };
}

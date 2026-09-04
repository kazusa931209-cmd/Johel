import {
  isNonEmptyResume,
  parseGeneratedResume,
} from "@johel/resume";

export function parseAiResumeJsonResponse(raw: string): {
  success: true;
  data: ReturnType<typeof parseGeneratedResume> extends { success: true; data: infer T }
    ? T
    : never;
} | { success: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: "AI returned empty JSON." };
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "AI response is not valid JSON." };
  }

  const validated = parseGeneratedResume(parsed);
  if (!validated.success) {
    return { success: false, error: validated.error };
  }

  if (!isNonEmptyResume(validated.data)) {
    return { success: false, error: "Generated resume is empty." };
  }

  return { success: true, data: validated.data };
}

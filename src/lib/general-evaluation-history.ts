export type GeneralEvaluationHistoryEntry = {
  id: string;
  userPrompt: string;
  markdown: string;
  createdAt: string;
};

export function parseGeneralEvaluationHistory(
  value: unknown,
): GeneralEvaluationHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: GeneralEvaluationHistoryEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : "";
    const markdown = typeof raw.markdown === "string" ? raw.markdown : "";
    const createdAt =
      typeof raw.createdAt === "string" ? raw.createdAt : "";
    const userPrompt =
      typeof raw.userPrompt === "string" ? raw.userPrompt : "";
    if (!id || !markdown || !createdAt) continue;
    entries.push({ id, userPrompt, markdown, createdAt });
  }
  return entries;
}

export function parseGeneralEvaluationHistoryJson(
  json: string | null | undefined,
): GeneralEvaluationHistoryEntry[] {
  if (!json?.trim()) return [];
  try {
    return parseGeneralEvaluationHistory(JSON.parse(json));
  } catch {
    return [];
  }
}

export function serializeGeneralEvaluationHistory(
  entries: GeneralEvaluationHistoryEntry[],
): string {
  return JSON.stringify(entries);
}

export function createGeneralEvaluationHistoryEntry(
  userPrompt: string,
  markdown: string,
): GeneralEvaluationHistoryEntry {
  return {
    id: crypto.randomUUID(),
    userPrompt: userPrompt.trim(),
    markdown,
    createdAt: new Date().toISOString(),
  };
}

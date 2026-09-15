export type AiAssistantCategory = "check-gaps";

export type AiAssistantOpenOptions = {
  query?: string;
  category?: AiAssistantCategory;
  generationId?: string | null;
};

export type NormalizedAiAssistantOpenOptions = {
  query: string;
  category: AiAssistantCategory;
  generationId: string | null;
};

export function normalizeAiAssistantOpenOptions(
  options?: AiAssistantOpenOptions,
): NormalizedAiAssistantOpenOptions {
  return {
    query: options?.query?.trim() ?? "",
    category: options?.category ?? "check-gaps",
    generationId: options?.generationId ?? null,
  };
}

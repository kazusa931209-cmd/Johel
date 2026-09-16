export type AiAssistantCategory = "check-on-experiences";

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
    category: options?.category ?? "check-on-experiences",
    generationId: options?.generationId ?? null,
  };
}

const AI_PROVIDER_LABELS: Record<string, string> = {
  cursor: "Cursor AI Agent",
  openai: "OpenAI",
};

const GENERATE_TYPE_LABELS: Record<string, string> = {
  verdict: "Verdict",
  generate: "Generate",
  evaluate: "Evaluate",
  promptOptimize: "Prompt Optimize",
};

export function formatAiProvider(aiProvider: string): string {
  return AI_PROVIDER_LABELS[aiProvider] ?? aiProvider;
}

export function formatGenerateType(generateType: string): string {
  return GENERATE_TYPE_LABELS[generateType] ?? generateType;
}

export function formatAiUsageDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

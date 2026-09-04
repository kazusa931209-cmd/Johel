export type AiProviderId = "cursor";

export type AiFilterUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type AiFilterRequest = {
  jobDescription: string;
  apiKey: string;
};

export type AiFilterProviderResult = {
  markdown: string;
  usage: AiFilterUsage;
};

export type AiFilterProvider = {
  id: AiProviderId;
  run(input: AiFilterRequest): Promise<AiFilterProviderResult>;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): AiFilterUsage {
  const inputToken =
    exact?.inputToken != null && Number.isFinite(exact.inputToken)
      ? Math.max(0, Math.round(exact.inputToken))
      : estimateTokens(inputText);
  const outputToken =
    exact?.outputToken != null && Number.isFinite(exact.outputToken)
      ? Math.max(0, Math.round(exact.outputToken))
      : estimateTokens(outputText);

  return {
    inputToken,
    outputToken,
    input: inputText,
    output: outputText,
  };
}

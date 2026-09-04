import type { AiProviderId } from "../ai-provider.js";

export type { AiProviderId };

export type AiVerdictUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type AiVerdictRequest = {
  jobDescription: string;
  verdictPrompt: string;
  apiKey: string;
};

export type AiVerdictProviderResult = {
  markdown: string;
  usage: AiVerdictUsage;
};

export type AiVerdictProvider = {
  id: AiProviderId;
  run(input: AiVerdictRequest): Promise<AiVerdictProviderResult>;
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  inputText: string,
  outputText: string,
  exact?: { inputToken?: number; outputToken?: number },
): AiVerdictUsage {
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

import { cursorAiEvaluateProvider } from "./cursor-provider.js";
import { openAiEvaluateProvider } from "./openai-provider.js";
import type {
  AiEvaluateProviderResult,
  AiEvaluateRequest,
  AiProviderId,
} from "./types.js";

export type {
  AiEvaluateProviderResult,
  AiEvaluateRequest,
  AiEvaluateUsage,
  AiProviderId,
} from "./types.js";

const providers = {
  cursor: cursorAiEvaluateProvider,
  openai: openAiEvaluateProvider,
} as const;

export async function runAiEvaluate(
  provider: AiProviderId,
  input: AiEvaluateRequest,
): Promise<AiEvaluateProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

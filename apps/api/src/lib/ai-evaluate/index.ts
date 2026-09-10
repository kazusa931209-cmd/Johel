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

export async function runAiEvaluate(
  _provider: AiProviderId,
  input: AiEvaluateRequest,
): Promise<AiEvaluateProviderResult> {
  return openAiEvaluateProvider.run(input);
}

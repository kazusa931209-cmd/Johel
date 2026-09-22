import { openAiEvaluateProvider } from "./openai-provider";
import type {
  AiEvaluateProviderResult,
  AiEvaluateRequest,
  AiProviderId,
} from "./types";

export type {
  AiEvaluateProviderResult,
  AiEvaluateRequest,
  AiEvaluateUsage,
  AiProviderId,
} from "./types";

export async function runAiEvaluate(
  _provider: AiProviderId,
  input: AiEvaluateRequest,
): Promise<AiEvaluateProviderResult> {
  return openAiEvaluateProvider.run(input);
}

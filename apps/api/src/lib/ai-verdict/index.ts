import { openAiVerdictProvider } from "./openai-provider.js";
import type {
  AiVerdictProviderResult,
  AiVerdictRequest,
  AiProviderId,
} from "./types.js";

export type {
  AiVerdictProviderResult,
  AiVerdictRequest,
  AiVerdictUsage,
  AiProviderId,
} from "./types.js";

export async function runAiVerdict(
  _provider: AiProviderId,
  input: AiVerdictRequest,
): Promise<AiVerdictProviderResult> {
  return openAiVerdictProvider.run(input);
}

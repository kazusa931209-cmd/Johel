import { openAiVerdictProvider } from "./openai-provider";
import type {
  AiVerdictProviderResult,
  AiVerdictRequest,
  AiProviderId,
} from "./types";

export type {
  AiVerdictProviderResult,
  AiVerdictRequest,
  AiVerdictUsage,
  AiProviderId,
} from "./types";

export async function runAiVerdict(
  _provider: AiProviderId,
  input: AiVerdictRequest,
): Promise<AiVerdictProviderResult> {
  return openAiVerdictProvider.run(input);
}

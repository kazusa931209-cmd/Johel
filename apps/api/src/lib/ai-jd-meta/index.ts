import { openAiJdMetaProvider } from "./openai-provider.js";
import type { AiJdMetaRequest, AiJdMetaResult, AiProviderId } from "./types.js";

export type { AiJdMetaRequest, AiJdMetaResult } from "./types.js";

export async function runAiJdMetaExtract(
  _provider: AiProviderId,
  input: AiJdMetaRequest,
): Promise<AiJdMetaResult> {
  return openAiJdMetaProvider.run(input);
}

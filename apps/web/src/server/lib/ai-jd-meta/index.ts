import { openAiJdMetaProvider } from "./openai-provider";
import type { AiJdMetaRequest, AiJdMetaResult, AiProviderId } from "./types";

export type { AiJdMetaRequest, AiJdMetaResult } from "./types";

export async function runAiJdMetaExtract(
  _provider: AiProviderId,
  input: AiJdMetaRequest,
): Promise<AiJdMetaResult> {
  return openAiJdMetaProvider.run(input);
}

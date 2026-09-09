import { openAiResumeProvider } from "./openai-provider.js";
import type {
  AiResumeProviderResult,
  AiResumeRequest,
  AiProviderId,
} from "./types.js";

export type {
  AiResumeProviderResult,
  AiResumeRequest,
  AiResumeUsage,
  AiProviderId,
} from "./types.js";

export async function runAiResume(
  _provider: AiProviderId,
  input: AiResumeRequest,
): Promise<AiResumeProviderResult> {
  return openAiResumeProvider.run(input);
}

import { openAiResumeProvider } from "./openai-provider";
import type {
  AiResumeProviderResult,
  AiResumeRequest,
  AiProviderId,
} from "./types";

export type {
  AiResumeProviderResult,
  AiResumeRequest,
  AiResumeUsage,
  AiProviderId,
} from "./types";

export async function runAiResume(
  _provider: AiProviderId,
  input: AiResumeRequest,
): Promise<AiResumeProviderResult> {
  return openAiResumeProvider.run(input);
}

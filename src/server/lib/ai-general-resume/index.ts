import { openAiGeneralResumeProvider } from "./openai-provider";
import type {
  AiResumeProviderResult,
  AiResumeRequest,
  AiProviderId,
} from "../ai-resume/types";

export async function runGeneralAiResume(
  _provider: AiProviderId,
  input: AiResumeRequest,
): Promise<AiResumeProviderResult> {
  return openAiGeneralResumeProvider.run(input);
}

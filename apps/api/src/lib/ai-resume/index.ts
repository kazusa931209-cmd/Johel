import { cursorAiResumeProvider } from "./cursor-provider.js";
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
  ResumeGenerationInput,
} from "./types.js";

const providers = {
  cursor: cursorAiResumeProvider,
} as const;

export async function runAiResume(
  provider: AiProviderId,
  input: AiResumeRequest,
): Promise<AiResumeProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

import { cursorAiVerdictProvider } from "./cursor-provider.js";
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

const providers = {
  cursor: cursorAiVerdictProvider,
} as const;

export async function runAiVerdict(
  provider: AiProviderId,
  input: AiVerdictRequest,
): Promise<AiVerdictProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

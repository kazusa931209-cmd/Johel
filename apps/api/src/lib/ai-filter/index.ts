import { cursorAiFilterProvider } from "./cursor-provider.js";
import type {
  AiFilterProviderResult,
  AiFilterRequest,
  AiProviderId,
} from "./types.js";

export type {
  AiFilterProviderResult,
  AiFilterRequest,
  AiFilterUsage,
  AiProviderId,
} from "./types.js";

const providers = {
  cursor: cursorAiFilterProvider,
} as const;

export async function runAiFilter(
  provider: AiProviderId,
  input: AiFilterRequest,
): Promise<AiFilterProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

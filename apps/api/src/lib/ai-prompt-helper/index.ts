import { cursorPromptHelperProvider } from "./cursor-provider.js";
import { openAiPromptHelperProvider } from "./openai-provider.js";
import type {
  PromptHelperKind,
  PromptHelperRequest,
  PromptHelperResult,
} from "./types.js";
import type { AiProviderId } from "../ai-provider.js";

export type {
  PromptHelperKind,
  PromptHelperRequest,
  PromptHelperResult,
} from "./types.js";

export { normalizePromptHelperSentence } from "./prompts.js";

const providers = {
  cursor: cursorPromptHelperProvider,
  openai: openAiPromptHelperProvider,
} as const;

export async function runAiPromptHelper(
  provider: AiProviderId,
  input: PromptHelperRequest,
): Promise<PromptHelperResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

import { cursorMarkdownFormatProvider } from "./cursor-provider.js";
import { openAiMarkdownFormatProvider } from "./openai-provider.js";
import type {
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types.js";
import type { AiProviderId } from "../ai-provider.js";

const providers = {
  cursor: cursorMarkdownFormatProvider,
  openai: openAiMarkdownFormatProvider,
} as const;

export async function runAiMarkdownFormat(
  provider: AiProviderId,
  input: MarkdownFormatRequest,
): Promise<MarkdownFormatResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

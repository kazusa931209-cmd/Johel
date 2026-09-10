import { openAiMarkdownFormatProvider } from "./openai-provider.js";
import type {
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types.js";
import type { AiProviderId } from "../ai-provider.js";

export async function runAiMarkdownFormat(
  _provider: AiProviderId,
  input: MarkdownFormatRequest,
): Promise<MarkdownFormatResult> {
  return openAiMarkdownFormatProvider.run(input);
}

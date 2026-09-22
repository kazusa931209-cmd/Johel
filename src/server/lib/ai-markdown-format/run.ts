import { openAiMarkdownFormatProvider } from "./openai-provider";
import type {
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types";
import type { AiProviderId } from "../ai-provider";

export async function runAiMarkdownFormat(
  _provider: AiProviderId,
  input: MarkdownFormatRequest,
): Promise<MarkdownFormatResult> {
  return openAiMarkdownFormatProvider.run(input);
}

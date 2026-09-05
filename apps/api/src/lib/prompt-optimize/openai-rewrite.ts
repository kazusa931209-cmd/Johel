import { runOpenAiVerdictResponse } from "../openai/responses.js";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildPromptRewriteUserMessage,
  getPromptRewriteSystemMessage,
} from "./rewrite-prompts.js";
import type { PromptRewriteResult } from "./rewrite.js";

export async function runOpenAiPromptRewrite(
  apiKey: string,
  compiledInstruction: string,
): Promise<PromptRewriteResult> {
  const instructions = getPromptRewriteSystemMessage();
  const input = buildPromptRewriteUserMessage(compiledInstruction);
  const response = await runOpenAiVerdictResponse(apiKey, instructions, input);
  const text = response.outputText.trim();
  if (!text) {
    throw new Error("OpenAI returned empty rewrite.");
  }

  return {
    text,
    usage: buildUsage(`${instructions}\n\n${input}`, text, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}

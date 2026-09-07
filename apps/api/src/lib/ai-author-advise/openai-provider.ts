import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import {
  buildAuthorAdviseUserPrompt,
  getAuthorAdviseSystemPrompt,
} from "./prompts.js";
import { parseAuthorAdviseResponse } from "./parse-response.js";
import {
  buildUsage,
  type AuthorAdviseProvider,
  type AuthorAdviseRequest,
  type AuthorAdviseProviderResult,
} from "./types.js";

export const openAiAuthorAdviseProvider: AuthorAdviseProvider = {
  id: "openai",

  async run(input: AuthorAdviseRequest): Promise<AuthorAdviseProviderResult> {
    const instructions = getAuthorAdviseSystemPrompt("openai");
    const user = buildAuthorAdviseUserPrompt(input);

    const response = await runOpenAiAuthorAdviseResponse(
      input.apiKey,
      instructions,
      user,
    );

    const raw = response.outputText;
    const parsed = parseAuthorAdviseResponse(raw, input.graph.scope);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, raw, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return { proposal: parsed.proposal, usage };
  },
};

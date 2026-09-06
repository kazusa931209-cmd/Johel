import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildPromptHelperUserMessage,
  getPromptHelperSystemMessage,
  normalizePromptHelperSentence,
} from "./prompts.js";
import type {
  PromptHelperProvider,
  PromptHelperRequest,
  PromptHelperResult,
} from "./types.js";

export const cursorPromptHelperProvider: PromptHelperProvider = {
  id: "cursor",

  async run(input: PromptHelperRequest): Promise<PromptHelperResult> {
    const system = getPromptHelperSystemMessage();
    const user = buildPromptHelperUserMessage(input);
    const prompt = `${system}\n\n${user}`;

    try {
      const result: RunResult = await Agent.prompt(prompt, {
        apiKey: input.apiKey,
        model: { id: "auto" },
        local: { cwd: process.cwd() },
      });

      if (result.status === "error") {
        throw new Error(
          result.error?.message || "Cursor AI Agent run failed.",
        );
      }

      const sentence = normalizePromptHelperSentence(result.result ?? "");
      if (!sentence) {
        throw new Error("Cursor AI Agent returned empty text.");
      }

      return {
        sentence,
        usage: buildUsage(prompt, sentence, {
          inputToken: result.usage?.inputTokens,
          outputToken: result.usage?.outputTokens,
        }),
      };
    } catch (err) {
      if (err instanceof CursorAgentError) {
        throw new Error(
          err.message || "Cursor AI Agent failed to start. Check the API key.",
        );
      }
      throw err;
    }
  },
};

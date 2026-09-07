import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildMarkdownFormatUserMessage,
  finalizeFormattedMarkdown,
  getMarkdownFormatSystemMessage,
  validateFormattedMarkdown,
} from "./prompts.js";
import type {
  MarkdownFormatProvider,
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types.js";

export const cursorMarkdownFormatProvider: MarkdownFormatProvider = {
  id: "cursor",

  async run(input: MarkdownFormatRequest): Promise<MarkdownFormatResult> {
    const system = getMarkdownFormatSystemMessage();
    const user = buildMarkdownFormatUserMessage(input);
    const prompt = `${system}\n\n${user}`;
    const maxLen = input.text.length + 5000;

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

      const markdown = finalizeFormattedMarkdown(input.kind, result.result ?? "");
      validateFormattedMarkdown(markdown, maxLen);

      return {
        markdown,
        usage: buildUsage(prompt, markdown, {
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

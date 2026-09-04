import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import {
  buildAiVerdictUserPrompt,
  getAiVerdictSystemPrompt,
} from "./prompts.js";
import {
  buildUsage,
  type AiVerdictProvider,
  type AiVerdictRequest,
  type AiVerdictProviderResult,
} from "./types.js";

export const cursorAiVerdictProvider: AiVerdictProvider = {
  id: "cursor",

  async run(input: AiVerdictRequest): Promise<AiVerdictProviderResult> {
    const system = getAiVerdictSystemPrompt("cursor", input.verdictPrompt);
    const user = buildAiVerdictUserPrompt(input.jobDescription);
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

      const markdown = (result.result ?? "").trim();
      if (!markdown) {
        throw new Error("Cursor AI Agent returned empty Markdown.");
      }

      const usage = buildUsage(prompt, markdown, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      });
      return { markdown, usage };
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

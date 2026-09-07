import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
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

export const cursorAuthorAdviseProvider: AuthorAdviseProvider = {
  id: "cursor",

  async run(input: AuthorAdviseRequest): Promise<AuthorAdviseProviderResult> {
    const system = getAuthorAdviseSystemPrompt("cursor");
    const user = buildAuthorAdviseUserPrompt(input);
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

      const raw = (result.result ?? "").trim();
      const parsed = parseAuthorAdviseResponse(raw, input.graph.scope);
      if (!parsed.success) {
        throw new Error(parsed.error);
      }

      const usage = buildUsage(prompt, raw, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      });

      return { proposal: parsed.proposal, usage };
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

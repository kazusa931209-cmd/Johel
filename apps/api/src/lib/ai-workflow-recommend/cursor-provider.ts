import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import {
  buildWorkflowRecommendUserPrompt,
  getWorkflowRecommendSystemPrompt,
} from "./prompts.js";
import { parseWorkflowRecommendResponse } from "./parse-response.js";
import {
  buildUsage,
  type WorkflowRecommendProvider,
  type WorkflowRecommendRequest,
  type WorkflowRecommendProviderResult,
} from "./types.js";

export const cursorWorkflowRecommendProvider: WorkflowRecommendProvider = {
  id: "cursor",

  async run(
    input: WorkflowRecommendRequest,
  ): Promise<WorkflowRecommendProviderResult> {
    const system = getWorkflowRecommendSystemPrompt("cursor");
    const user = buildWorkflowRecommendUserPrompt(input);
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
      const parsed = parseWorkflowRecommendResponse(raw);
      if (!parsed.success) {
        throw new Error(parsed.error);
      }

      const usage = buildUsage(prompt, raw, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      });

      return { matches: parsed.matches, usage };
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

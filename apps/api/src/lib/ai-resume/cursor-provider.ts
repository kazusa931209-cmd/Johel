import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { parseAiResumeJsonResponse } from "./parse-response.js";
import {
  buildAiResumeUserPrompt,
  getAiResumeSystemPrompt,
} from "./prompts.js";
import {
  buildUsage,
  type AiResumeProvider,
  type AiResumeRequest,
  type AiResumeProviderResult,
} from "./types.js";

export const cursorAiResumeProvider: AiResumeProvider = {
  id: "cursor",

  async run(input: AiResumeRequest): Promise<AiResumeProviderResult> {
    const system = getAiResumeSystemPrompt("cursor");
    const user = buildAiResumeUserPrompt(input.input);
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
      const parsed = parseAiResumeJsonResponse(raw);
      if (!parsed.success) {
        throw new Error(parsed.error);
      }

      const usage = buildUsage(prompt, raw, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      });

      return { resume: parsed.data, usage };
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

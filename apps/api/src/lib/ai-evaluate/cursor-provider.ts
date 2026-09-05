import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { resumeToMarkdown } from "@johel/resume";
import {
  buildAiEvaluateUserPrompt,
  getAiEvaluateSystemPrompt,
} from "./prompts.js";
import {
  buildUsage,
  type AiEvaluateProvider,
  type AiEvaluateRequest,
  type AiEvaluateProviderResult,
} from "./types.js";

export const cursorAiEvaluateProvider: AiEvaluateProvider = {
  id: "cursor",

  async run(input: AiEvaluateRequest): Promise<AiEvaluateProviderResult> {
    const system = getAiEvaluateSystemPrompt("cursor", input.evaluatePrompt);
    const resumeMarkdown = resumeToMarkdown(input.resume);
    const user = buildAiEvaluateUserPrompt(
      input.jobDescription,
      resumeMarkdown,
    );
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

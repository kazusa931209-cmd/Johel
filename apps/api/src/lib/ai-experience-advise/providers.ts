import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import {
  buildExperienceAdviseUserPrompt,
  getExperienceAdviseSystemPrompt,
} from "./prompts.js";
import { parseExperienceAdviseResponse } from "./parse-response.js";
import {
  buildUsage,
  type ExperienceAdviseProvider,
  type ExperienceAdviseRequest,
  type ExperienceAdviseProviderResult,
} from "./types.js";

function graphExperienceIds(
  graph: ExperienceAdviseRequest["graph"],
): Set<string> {
  return new Set(graph.experiences.map((item) => item.id));
}

export const cursorExperienceAdviseProvider: ExperienceAdviseProvider = {
  id: "cursor",

  async run(
    input: ExperienceAdviseRequest,
  ): Promise<ExperienceAdviseProviderResult> {
    const system = getExperienceAdviseSystemPrompt("cursor");
    const user = buildExperienceAdviseUserPrompt(input);
    const prompt = `${system}\n\n${user}`;
    const ids = graphExperienceIds(input.graph);

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
      const parsed = parseExperienceAdviseResponse(raw, ids);
      if (!parsed.success) {
        throw new Error(parsed.error);
      }

      const usage = buildUsage(prompt, raw, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      });

      return { result: parsed.result, usage };
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

export const openAiExperienceAdviseProvider: ExperienceAdviseProvider = {
  id: "openai",

  async run(
    input: ExperienceAdviseRequest,
  ): Promise<ExperienceAdviseProviderResult> {
    const instructions = getExperienceAdviseSystemPrompt("openai");
    const user = buildExperienceAdviseUserPrompt(input);
    const ids = graphExperienceIds(input.graph);

    const response = await runOpenAiAuthorAdviseResponse(
      input.apiKey,
      instructions,
      user,
    );

    const raw = response.outputText;
    const parsed = parseExperienceAdviseResponse(raw, ids);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, raw, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return { result: parsed.result, usage };
  },
};

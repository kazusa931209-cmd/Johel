import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import type { AiProviderId } from "../ai-provider.js";
import { buildUsage } from "../ai-verdict/types.js";
import { runOpenAiSolResponse } from "../openai/responses.js";
import {
  buildExperienceFieldsFormatUserMessage,
  getExperienceFieldsFormatSystemMessage,
  parseExperienceFieldsFormatResponse,
} from "./prompts.js";
import type {
  ExperienceFieldsMarkdownFormatRequest,
  ExperienceFieldsMarkdownFormatResult,
} from "./types.js";

async function runOpenAiExperienceFieldsFormat(
  input: ExperienceFieldsMarkdownFormatRequest,
): Promise<ExperienceFieldsMarkdownFormatResult> {
  const instructions = getExperienceFieldsFormatSystemMessage();
  const user = buildExperienceFieldsFormatUserMessage(input);
  const response = await runOpenAiSolResponse(input.apiKey, instructions, user, {
    jsonOutput: true,
  });

  const fields = parseExperienceFieldsFormatResponse(
    response.outputText,
    20_000,
  );

  return {
    ...fields,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}

async function runCursorExperienceFieldsFormat(
  input: ExperienceFieldsMarkdownFormatRequest,
): Promise<ExperienceFieldsMarkdownFormatResult> {
  const system = getExperienceFieldsFormatSystemMessage();
  const user = buildExperienceFieldsFormatUserMessage(input);
  const prompt = `${system}\n\n${user}`;

  try {
    const result: RunResult = await Agent.prompt(prompt, {
      apiKey: input.apiKey,
      model: { id: "auto" },
      local: { cwd: process.cwd() },
    });

    if (result.status === "error") {
      throw new Error(result.error?.message || "Cursor AI Agent run failed.");
    }

    const raw = (result.result ?? "").trim();
    const fields = parseExperienceFieldsFormatResponse(raw, 20_000);

    return {
      ...fields,
      usage: buildUsage(prompt, raw, {
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
}

export async function runAiExperienceFieldsMarkdownFormat(
  provider: AiProviderId,
  input: ExperienceFieldsMarkdownFormatRequest,
): Promise<ExperienceFieldsMarkdownFormatResult> {
  if (provider === "openai") {
    return runOpenAiExperienceFieldsFormat(input);
  }
  if (provider === "cursor") {
    return runCursorExperienceFieldsFormat(input);
  }
  throw new Error(`Unsupported AI provider: ${provider}`);
}

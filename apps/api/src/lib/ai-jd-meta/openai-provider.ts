import { z } from "zod";
import { runOpenAiJdMetaResponse } from "../openai/responses.js";
import { buildUsage } from "../ai-verdict/types.js";
import {
  buildAiJdMetaUserPrompt,
  getAiJdMetaSystemPrompt,
} from "./prompts.js";
import type {
  AiJdMetaProvider,
  AiJdMetaRequest,
  AiJdMetaResult,
} from "./types.js";

const responseSchema = z.object({
  jdCompanyName: z.string(),
  jdJobRole: z.string(),
});

function normalizeField(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (
    !trimmed ||
    lower === "not found" ||
    lower === "not specified" ||
    lower === "n/a" ||
    lower === "none"
  ) {
    return "";
  }
  return trimmed;
}

export const openAiJdMetaProvider: AiJdMetaProvider = {
  id: "openai",

  async run(input: AiJdMetaRequest): Promise<AiJdMetaResult> {
    const instructions = getAiJdMetaSystemPrompt();
    const user = buildAiJdMetaUserPrompt(input.jobDescription);

    const response = await runOpenAiJdMetaResponse(
      input.apiKey,
      instructions,
      user,
    );

    const outputText = response.outputText;
    if (!outputText) {
      throw new Error("OpenAI returned empty JSON.");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(outputText);
    } catch {
      throw new Error("OpenAI returned invalid JSON for JD metadata.");
    }

    const parsed = responseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error("OpenAI returned invalid JD metadata shape.");
    }

    const usage = buildUsage(`${instructions}\n\n${user}`, outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    });

    return {
      jdCompanyName: normalizeField(parsed.data.jdCompanyName),
      jdJobRole: normalizeField(parsed.data.jdJobRole),
      usage,
    };
  },
};

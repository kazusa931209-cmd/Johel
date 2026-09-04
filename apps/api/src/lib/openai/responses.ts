import type OpenAI from "openai";
import { createOpenAiClient, extractOpenAiTokenUsage, mapOpenAiError } from "./client.js";

export const OPENAI_VERDICT_MODEL = "gpt-5.6-luna";
export const OPENAI_RESUME_MODEL = "gpt-5.6-terra";

type ReasoningEffort = "low" | "medium" | "high";

type OpenAiTextResponse = {
  outputText: string;
  inputToken?: number;
  outputToken?: number;
};

async function createTextResponse(
  apiKey: string,
  options: {
    model: string;
    instructions: string;
    input: string;
    reasoningEffort: ReasoningEffort;
    jsonOutput?: boolean;
  },
): Promise<OpenAiTextResponse> {
  const client = createOpenAiClient(apiKey);

  const request: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: options.model,
    instructions: options.instructions,
    input: options.input,
    reasoning: { effort: options.reasoningEffort },
  };

  if (options.jsonOutput) {
    request.text = {
      format: { type: "json_object" },
    };
  }

  try {
    const response = await client.responses.create(request);
    const outputText = (response.output_text ?? "").trim();
    const usage = extractOpenAiTokenUsage(response.usage);

    return {
      outputText,
      inputToken: usage.inputToken,
      outputToken: usage.outputToken,
    };
  } catch (err) {
    throw mapOpenAiError(err);
  }
}

export async function runOpenAiVerdictResponse(
  apiKey: string,
  instructions: string,
  input: string,
): Promise<OpenAiTextResponse> {
  return createTextResponse(apiKey, {
    model: OPENAI_VERDICT_MODEL,
    instructions,
    input,
    reasoningEffort: "low",
  });
}

export async function runOpenAiResumeResponse(
  apiKey: string,
  instructions: string,
  input: string,
): Promise<OpenAiTextResponse> {
  return createTextResponse(apiKey, {
    model: OPENAI_RESUME_MODEL,
    instructions,
    input,
    reasoningEffort: "medium",
    jsonOutput: true,
  });
}

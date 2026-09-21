import type OpenAI from "openai";
import { createOpenAiClient, extractOpenAiTokenUsage, mapOpenAiError } from "./client";

export const OPENAI_VERDICT_MODEL = "gpt-5.6-luna";
export const OPENAI_RESUME_MODEL = "gpt-5.6-terra";
export const OPENAI_FORMAT_MODEL = "gpt-5.6-sol";

type ReasoningEffort = "low" | "medium" | "high";

type OpenAiTextResponse = {
  outputText: string;
  inputToken?: number;
  outputToken?: number;
};

/** OpenAI json_object format requires the word "json" in the input message. */
function ensureJsonInInput(input: string): string {
  if (/json/i.test(input)) {
    return input;
  }
  return `${input}\n\nRespond with a JSON object only. Do not wrap in a code fence.`;
}

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
  const input = options.jsonOutput
    ? ensureJsonInInput(options.input)
    : options.input;

  const request: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: options.model,
    instructions: options.instructions,
    input,
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

export async function runOpenAiEvaluateResponse(
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

export async function runOpenAiSolResponse(
  apiKey: string,
  instructions: string,
  input: string,
  options?: { jsonOutput?: boolean },
): Promise<OpenAiTextResponse> {
  return createTextResponse(apiKey, {
    model: OPENAI_FORMAT_MODEL,
    instructions,
    input,
    reasoningEffort: "low",
    jsonOutput: options?.jsonOutput,
  });
}

export async function runOpenAiMarkdownFormatResponse(
  apiKey: string,
  instructions: string,
  input: string,
): Promise<OpenAiTextResponse> {
  return runOpenAiSolResponse(apiKey, instructions, input);
}

export async function runOpenAiAuthorAdviseResponse(
  apiKey: string,
  instructions: string,
  input: string,
): Promise<OpenAiTextResponse> {
  return createTextResponse(apiKey, {
    model: OPENAI_VERDICT_MODEL,
    instructions,
    input,
    reasoningEffort: "low",
    jsonOutput: true,
  });
}

export async function runOpenAiJdMetaResponse(
  apiKey: string,
  instructions: string,
  input: string,
): Promise<OpenAiTextResponse> {
  return createTextResponse(apiKey, {
    model: OPENAI_VERDICT_MODEL,
    instructions,
    input,
    reasoningEffort: "low",
    jsonOutput: true,
  });
}

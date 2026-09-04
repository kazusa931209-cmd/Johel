import OpenAI from "openai";

export function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

export type OpenAiTokenUsage = {
  inputToken?: number;
  outputToken?: number;
};

export function extractOpenAiTokenUsage(
  usage: OpenAI.Responses.ResponseUsage | undefined,
): OpenAiTokenUsage {
  if (!usage) {
    return {};
  }

  return {
    inputToken: usage.input_tokens,
    outputToken: usage.output_tokens,
  };
}

export function mapOpenAiError(err: unknown): Error {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) {
      return new Error(
        "OpenAI API key is invalid. Check your key in Settings.",
      );
    }
    if (err.status === 429) {
      return new Error(
        "OpenAI rate limit or quota exceeded. Try again later.",
      );
    }
    const message = err.error && typeof err.error === "object" && "message" in err.error
      ? String(err.error.message)
      : err.message;
    return new Error(message || "OpenAI request failed.");
  }

  if (err instanceof Error && err.message) {
    return err;
  }

  return new Error("OpenAI request failed.");
}

import { createOpenAiClient, mapOpenAiError } from "./client";

export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export type EmbeddingResult = {
  vector: number[];
  inputToken: number;
};

export async function createOpenAiEmbedding(
  apiKey: string,
  input: string,
): Promise<EmbeddingResult> {
  const client = createOpenAiClient(apiKey);
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Embedding input text is required.");
  }

  try {
    const response = await client.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: trimmed,
    });
    const vector = response.data[0]?.embedding;
    if (!vector?.length) {
      throw new Error("OpenAI returned an empty embedding.");
    }
    return {
      vector,
      inputToken: response.usage?.prompt_tokens ?? 0,
    };
  } catch (err) {
    throw mapOpenAiError(err);
  }
}

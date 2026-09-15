import { describe, expect, it } from "vitest";
import { resolveAiModelName } from "../record-ai-usage.js";
import { OPENAI_EMBEDDING_MODEL } from "../openai/embeddings.js";
import {
  OPENAI_FORMAT_MODEL,
  OPENAI_RESUME_MODEL,
  OPENAI_VERDICT_MODEL,
} from "../openai/responses.js";

describe("resolveAiModelName", () => {
  it("returns resume model for OpenAI generate", () => {
    expect(resolveAiModelName("openai", "generate")).toBe(OPENAI_RESUME_MODEL);
  });

  it("returns verdict model for OpenAI non-generate types", () => {
    expect(resolveAiModelName("openai", "verdict")).toBe(OPENAI_VERDICT_MODEL);
    expect(resolveAiModelName("openai", "evaluate")).toBe(OPENAI_VERDICT_MODEL);
    expect(resolveAiModelName("openai", "workflowRecommend")).toBe(
      OPENAI_VERDICT_MODEL,
    );
    expect(resolveAiModelName("openai", "authorAdvise")).toBe(
      OPENAI_VERDICT_MODEL,
    );
    expect(resolveAiModelName("openai", "experienceSplit")).toBe(
      OPENAI_VERDICT_MODEL,
    );
    expect(resolveAiModelName("openai", "markdownFormat")).toBe(
      OPENAI_FORMAT_MODEL,
    );
  });

  it("returns embedding model for embedding generateType", () => {
    expect(resolveAiModelName("openai", "embedding")).toBe(
      OPENAI_EMBEDDING_MODEL,
    );
  });
});

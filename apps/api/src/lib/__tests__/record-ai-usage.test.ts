import { describe, expect, it } from "vitest";
import {
  CURSOR_MODEL_NAME,
  resolveAiModelName,
} from "../record-ai-usage.js";
import {
  OPENAI_FORMAT_MODEL,
  OPENAI_RESUME_MODEL,
  OPENAI_VERDICT_MODEL,
} from "../openai/responses.js";

describe("resolveAiModelName", () => {
  it("returns auto for Cursor", () => {
    expect(resolveAiModelName("cursor", "verdict")).toBe(CURSOR_MODEL_NAME);
    expect(resolveAiModelName("cursor", "generate")).toBe(CURSOR_MODEL_NAME);
  });

  it("returns resume model for OpenAI generate", () => {
    expect(resolveAiModelName("openai", "generate")).toBe(OPENAI_RESUME_MODEL);
  });

  it("returns verdict model for OpenAI non-generate types", () => {
    expect(resolveAiModelName("openai", "verdict")).toBe(OPENAI_VERDICT_MODEL);
    expect(resolveAiModelName("openai", "evaluate")).toBe(OPENAI_VERDICT_MODEL);
    expect(resolveAiModelName("openai", "workflowRecommend")).toBe(
      OPENAI_VERDICT_MODEL,
    );
    expect(resolveAiModelName("openai", "markdownFormat")).toBe(
      OPENAI_FORMAT_MODEL,
    );
    expect(resolveAiModelName("openai", "promptHelper")).toBe(
      OPENAI_FORMAT_MODEL,
    );
  });
});

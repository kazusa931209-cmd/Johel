import { describe, expect, it } from "vitest";
import {
  buildAiJdMetaUserPrompt,
  getAiJdMetaSystemPrompt,
} from "../prompts.js";

describe("ai-jd-meta prompts", () => {
  it("requests JSON output in the system prompt", () => {
    expect(getAiJdMetaSystemPrompt()).toContain("JSON object");
  });

  it("wraps the job description in the user prompt", () => {
    const prompt = buildAiJdMetaUserPrompt("Senior Engineer at Acme");
    expect(prompt).toContain("Senior Engineer at Acme");
    expect(prompt).toContain("JSON object");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildGeneralAiEvaluateUserPrompt,
  buildGeneralEvaluateResponseLanguageSection,
  getGeneralAiEvaluateUserPromptOnlySystemPrompt,
} from "../prompts";

describe("buildGeneralEvaluateResponseLanguageSection", () => {
  it("uses UI locale when user prompt is empty", () => {
    const section = buildGeneralEvaluateResponseLanguageSection("", "ko");
    expect(section).toContain("Korean");
    expect(section).toContain("did not add a custom prompt");
  });

  it("follows user prompt language when prompt is present", () => {
    const section = buildGeneralEvaluateResponseLanguageSection(
      "ATS formatting만 봐 주세요",
      "en",
    );
    expect(section).toContain("User prompt");
    expect(section).toContain("explicitly requests");
  });
});

describe("buildGeneralAiEvaluateUserPrompt", () => {
  it("includes response language before resume", () => {
    const prompt = buildGeneralAiEvaluateUserPrompt("", "# Resume", "en");
    expect(prompt.indexOf("## Response language")).toBeLessThan(
      prompt.indexOf("## Resume"),
    );
  });
});

describe("getGeneralAiEvaluateUserPromptOnlySystemPrompt", () => {
  it("does not include General Evaluate instructions placeholder", () => {
    const instructions = getGeneralAiEvaluateUserPromptOnlySystemPrompt("openai");
    expect(instructions).toContain("User prompt");
    expect(instructions).not.toContain("Instructions above");
  });
});

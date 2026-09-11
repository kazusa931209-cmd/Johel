import { describe, expect, it } from "vitest";
import { getCombineRecommendSystemPrompt } from "../prompts.js";

describe("getCombineRecommendSystemPrompt", () => {
  it("uses the default 2–5 pick rule", () => {
    const prompt = getCombineRecommendSystemPrompt(5);
    expect(prompt).toContain("Pick 2–5 experience cards per company when possible");
  });

  it("uses a single-card pick rule when max is 1", () => {
    const prompt = getCombineRecommendSystemPrompt(1);
    expect(prompt).toContain("Pick 1 experience card per company when possible");
    expect(prompt).not.toContain("2–5");
  });
});

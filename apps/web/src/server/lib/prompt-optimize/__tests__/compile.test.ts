import { describe, expect, it } from "vitest";
import {
  appendOneTimeGeneratePrompt,
  compileInstruction,
  PROMPT_SECTION_SEPARATOR,
} from "../compile";

describe("compileInstruction", () => {
  it("trims and collapses extra blank lines", () => {
    const result = compileInstruction("verdict", "  Check fit\n\n\n\nList skills  ");
    expect(result).toContain("Check fit");
    expect(result).toContain("List skills");
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("wraps user instruction under # Instructions with a strong separator", () => {
    const result = compileInstruction("verdict", "Answer these questions.");
    expect(result).toContain("# Instructions");
    expect(result).toContain("Answer these questions.");
    expect(result).toContain(PROMPT_SECTION_SEPARATOR);
    expect(result).not.toContain("## User instruction");
  });

  it("does not paraphrase the user wording", () => {
    const original = "Should I apply if remote-only?";
    const result = compileInstruction("evaluate", original);
    expect(result).toContain(original);
  });

  it("uses the same compile shape for generate and evaluate", () => {
    const generate = compileInstruction("generate", "Tailor the resume.");
    const evaluate = compileInstruction("evaluate", "Score the resume.");
    expect(generate).toContain("# Instructions");
    expect(evaluate).toContain("# Instructions");
    expect(generate).not.toContain("Do not invent employers");
    expect(evaluate).not.toContain("Do not invent employers");
  });

  it("appends user extension after the base prompt", () => {
    const result = compileInstruction(
      "verdict",
      "Check fit.",
      "Prefer remote roles.",
    );
    expect(result).toContain("Check fit.");
    expect(result).toContain("Prefer remote roles.");
  });
});

describe("appendOneTimeGeneratePrompt", () => {
  it("returns compiled prompt unchanged when one-time prompt is empty", () => {
    const compiled = compileInstruction("generate", "Tailor the resume.");
    expect(appendOneTimeGeneratePrompt(compiled, "")).toBe(compiled);
    expect(appendOneTimeGeneratePrompt(compiled, "   ")).toBe(compiled);
  });

  it("appends one-time prompt under a # heading with separator", () => {
    const compiled = compileInstruction("generate", "Tailor the resume.");
    const result = appendOneTimeGeneratePrompt(
      compiled,
      "Emphasize leadership.",
    );
    expect(result).toContain("# One-time prompt");
    expect(result).toContain("Emphasize leadership.");
    expect(result).toContain(PROMPT_SECTION_SEPARATOR);
  });
});

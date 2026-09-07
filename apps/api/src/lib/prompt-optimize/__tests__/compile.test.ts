import { describe, expect, it } from "vitest";
import {
  appendOneTimeGeneratePrompt,
  compileInstruction,
} from "../compile.js";

describe("compileInstruction", () => {
  it("trims and collapses extra blank lines", () => {
    const result = compileInstruction("verdict", "  Check fit\n\n\n\nList skills  ");
    expect(result).toContain("Check fit");
    expect(result).toContain("List skills");
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("wraps user instruction in a stable fence", () => {
    const result = compileInstruction("verdict", "Answer these questions.");
    expect(result).toContain("## User instruction");
    expect(result).toContain("Answer these questions.");
    expect(result).toContain("---");
  });

  it("does not paraphrase the user wording", () => {
    const original = "Should I apply if remote-only?";
    const result = compileInstruction("evaluate", original);
    expect(result).toContain(original);
  });

  it("adds generate honesty line only for generate kind", () => {
    const verdict = compileInstruction("verdict", "Tailor the resume.");
    const generate = compileInstruction("generate", "Tailor the resume.");
    expect(verdict).not.toContain("Do not invent employers");
    expect(generate).toContain("Do not invent employers");
  });
});

describe("appendOneTimeGeneratePrompt", () => {
  it("returns compiled prompt unchanged when one-time prompt is empty", () => {
    const compiled = compileInstruction("generate", "Tailor the resume.");
    expect(appendOneTimeGeneratePrompt(compiled, "")).toBe(compiled);
    expect(appendOneTimeGeneratePrompt(compiled, "   ")).toBe(compiled);
  });

  it("appends one-time prompt under a heading", () => {
    const compiled = compileInstruction("generate", "Tailor the resume.");
    const result = appendOneTimeGeneratePrompt(
      compiled,
      "Emphasize leadership.",
    );
    expect(result).toContain("## One-time prompt");
    expect(result).toContain("Emphasize leadership.");
  });
});

import { describe, expect, it } from "vitest";
import {
  isMarkdownFormatUnchanged,
  normalizeFormattedMarkdown,
  validateFormattedMarkdown,
} from "../prompts.js";

describe("isMarkdownFormatUnchanged", () => {
  it("returns true when trimmed text matches stored", () => {
    expect(isMarkdownFormatUnchanged("hello", "hello")).toBe(true);
    expect(isMarkdownFormatUnchanged("  hello  ", "hello")).toBe(true);
    expect(isMarkdownFormatUnchanged("hello", "  hello  ")).toBe(true);
  });

  it("returns false when text differs", () => {
    expect(isMarkdownFormatUnchanged("hello", "world")).toBe(false);
    expect(isMarkdownFormatUnchanged("hello", "")).toBe(false);
    expect(isMarkdownFormatUnchanged("hello", null)).toBe(false);
  });

  it("treats null/undefined stored as empty", () => {
    expect(isMarkdownFormatUnchanged("", null)).toBe(true);
    expect(isMarkdownFormatUnchanged("", undefined)).toBe(true);
    expect(isMarkdownFormatUnchanged("x", null)).toBe(false);
  });
});

describe("normalizeFormattedMarkdown", () => {
  it("trims whitespace", () => {
    expect(normalizeFormattedMarkdown("  hello  ")).toBe("hello");
  });

  it("strips markdown code fences", () => {
    expect(normalizeFormattedMarkdown("```markdown\n# Title\n\nBody\n```")).toBe(
      "# Title\n\nBody",
    );
    expect(normalizeFormattedMarkdown("```md\n## Section\n```")).toBe(
      "## Section",
    );
    expect(normalizeFormattedMarkdown("```\nplain\n```")).toBe("plain");
  });

  it("returns empty for empty input", () => {
    expect(normalizeFormattedMarkdown("")).toBe("");
    expect(normalizeFormattedMarkdown("   ")).toBe("");
  });
});

describe("validateFormattedMarkdown", () => {
  it("accepts non-empty text within max length", () => {
    expect(() => validateFormattedMarkdown("hello", 10)).not.toThrow();
  });

  it("rejects empty text", () => {
    expect(() => validateFormattedMarkdown("", 10)).toThrow(
      "Markdown conversion returned empty text.",
    );
    expect(() => validateFormattedMarkdown("   ", 10)).toThrow(
      "Markdown conversion returned empty text.",
    );
  });

  it("rejects text over max length", () => {
    expect(() => validateFormattedMarkdown("abcdef", 5)).toThrow(
      "Markdown conversion exceeded the maximum length of 5 characters.",
    );
  });
});

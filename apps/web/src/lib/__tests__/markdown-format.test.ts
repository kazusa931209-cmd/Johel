import { describe, expect, it } from "vitest";
import { needsMarkdownFormatOnSave } from "../markdown-format";

describe("needsMarkdownFormatOnSave", () => {
  it("returns false when trimmed text matches stored", () => {
    expect(needsMarkdownFormatOnSave("hello", "hello")).toBe(false);
    expect(needsMarkdownFormatOnSave("  hello  ", "hello")).toBe(false);
  });

  it("returns true when text differs", () => {
    expect(needsMarkdownFormatOnSave("hello", "world")).toBe(true);
    expect(needsMarkdownFormatOnSave("hello", "")).toBe(true);
    expect(needsMarkdownFormatOnSave("hello", null)).toBe(true);
  });
});

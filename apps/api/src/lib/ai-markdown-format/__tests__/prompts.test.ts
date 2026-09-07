import { describe, expect, it } from "vitest";
import {
  capPromptHeadings,
  finalizeFormattedMarkdown,
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

describe("capPromptHeadings", () => {
  it("demotes h1 headings to h2", () => {
    expect(capPromptHeadings("# Title\n\n## Section")).toBe(
      "## Title\n\n## Section",
    );
  });

  it("leaves h2 and below unchanged", () => {
    expect(capPromptHeadings("## Title\n\n### Section")).toBe(
      "## Title\n\n### Section",
    );
  });
});

describe("finalizeFormattedMarkdown", () => {
  it("caps prompt instruction kinds after normalization", () => {
    expect(finalizeFormattedMarkdown("verdict", "# Verdict\n\nBody")).toBe(
      "## Verdict\n\nBody",
    );
  });

  it("does not cap company what-it-is fields", () => {
    expect(finalizeFormattedMarkdown("companyWhatItIs", "# About")).toBe(
      "# About",
    );
  });

  it("strips headings and field-type metadata from structured list kinds", () => {
    const raw = [
      "# Startup Experience",
      "",
      "**Field type:** Experience actions (used when generating résumés from workflow data)",
      "",
      "- **Startup experience**",
      "  Use this when the job description lists startup experience as a must-have.",
    ].join("\n");

    expect(finalizeFormattedMarkdown("experienceActions", raw)).toBe(
      "- **Startup experience**\n  Use this when the job description lists startup experience as a must-have.",
    );
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

import { describe, expect, it } from "vitest";
import { appendPromptHelperText } from "../prompts";

describe("appendPromptHelperText", () => {
  it("appends under ## New when prompt has content", () => {
    expect(appendPromptHelperText("Line one.", "Add clarity.")).toBe(
      "Line one.\n\n## New\nAdd clarity.",
    );
  });

  it("returns only the block when prompt is empty", () => {
    expect(appendPromptHelperText("", "First instruction.")).toBe(
      "## New\nFirst instruction.",
    );
  });

  it("preserves trailing content spacing via trimEnd on current", () => {
    expect(appendPromptHelperText("  Existing  ", "Next.")).toBe(
      "  Existing\n\n## New\nNext.",
    );
  });
});

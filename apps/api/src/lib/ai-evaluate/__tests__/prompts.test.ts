import { describe, expect, it } from "vitest";
import { buildAiEvaluateUserPrompt } from "../prompts.js";

describe("buildAiEvaluateUserPrompt", () => {
  it("labels Job context and Resume as Markdown sections", () => {
    const prompt = buildAiEvaluateUserPrompt(
      "## Role\nTitle: Engineer\n\n## Final Verdict\n- Hire for Go",
      "# Jane Doe\n\n## Summary\nBackend engineer.",
    );

    expect(prompt).toContain("## Job context");
    expect(prompt).toContain("### Headings in this job context");
    expect(prompt).toContain("- Role");
    expect(prompt).toContain("- Final Verdict");
    expect(prompt).toContain("## Resume");
    expect(prompt).toContain("# Jane Doe");
    expect(prompt).not.toContain("Job Description:");
    expect(prompt).not.toMatch(/"jobContext"\s*:/);
  });
});

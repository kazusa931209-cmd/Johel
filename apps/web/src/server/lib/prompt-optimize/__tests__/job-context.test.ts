import { describe, expect, it } from "vitest";
import {
  extractMarkdownHeadings,
  formatJobContextBlock,
} from "../job-context";

describe("extractMarkdownHeadings", () => {
  it("collects ATX headings levels 1–3", () => {
    const markdown = `# Title
## Role
### Required
#### Ignored
plain text
## Technical Requirements`;
    expect(extractMarkdownHeadings(markdown)).toEqual([
      "Title",
      "Role",
      "Required",
      "Technical Requirements",
    ]);
  });

  it("returns an empty list when there are no headings", () => {
    expect(extractMarkdownHeadings("No headings here.")).toEqual([]);
  });
});

describe("formatJobContextBlock", () => {
  it("prepends a heading list when headings are present", () => {
    const block = formatJobContextBlock(
      "## Role\nTitle: Engineer\n\n## Final Verdict\n- Go",
    );
    expect(block).toContain("## Job context");
    expect(block).toContain("### Headings in this job context");
    expect(block).toContain("- Role");
    expect(block).toContain("- Final Verdict");
    expect(block).toContain("Title: Engineer");
  });

  it("omits the heading list when none exist", () => {
    const block = formatJobContextBlock("Plain filtered job text.");
    expect(block).toBe("## Job context\n\nPlain filtered job text.");
  });
});

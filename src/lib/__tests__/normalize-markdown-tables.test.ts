import { describe, expect, it } from "vitest";
import { normalizeGluedMarkdownTableRows } from "../normalize-markdown-tables";

describe("normalizeGluedMarkdownTableRows", () => {
  it("splits table rows glued on one line", () => {
    const input =
      "| 평가 항목 | 점수 | 감점 사유 | |---|---:|---| | 품질 | 7/10 | 이유 |";
    const output = normalizeGluedMarkdownTableRows(input);
    expect(output).toContain("| 평가 항목 | 점수 | 감점 사유 |\n");
    expect(output).toContain("|---|---:|---|\n");
    expect(output).toContain("| 품질 | 7/10 | 이유 |");
  });

  it("leaves already multiline tables unchanged", () => {
    const input = "| a | b |\n| --- | --- |\n| 1 | 2 |";
    expect(normalizeGluedMarkdownTableRows(input)).toBe(input);
  });
});

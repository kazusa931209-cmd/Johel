import { describe, expect, it } from "vitest";
import { MarkdownFilter } from "../filters/markdown.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new MarkdownFilter().apply(createInitialContext(input)).text;
}

describe("MarkdownFilter", () => {
  it("removes image markdown and [image](url)", () => {
    const text = run(
      "![logo](https://x/a.png)\n[image](https://api.dejob.ai/images/default/14.png)\nGolang",
    );
    expect(text).not.toContain("https://x/a.png");
    expect(text).not.toContain("[image]");
    expect(text).toContain("Golang");
  });

  it("keeps link label text", () => {
    expect(run("[BIT](https://www.bit.com/)")).toContain("BIT");
    expect(run("[BIT](https://www.bit.com/)")).not.toContain("https://www.bit.com/");
  });

  it("preserves bare company URLs in prose", () => {
    const text = run("Company Website: https://www.bit.com/");
    expect(text).toContain("https://www.bit.com/");
  });
});

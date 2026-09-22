import { describe, expect, it } from "vitest";
import { HtmlFilter } from "../filters/html.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new HtmlFilter().apply(createInitialContext(input)).text;
}

describe("HtmlFilter", () => {
  it("leaves plain text unchanged", () => {
    expect(run("Golang Engineer\nRedis")).toBe("Golang Engineer\nRedis");
  });

  it("strips script and style and extracts visible text", () => {
    const html = `
      <html><head><style>.x{color:red}</style><script>alert(1)</script></head>
      <body><h1>Golang Engineer</h1><p>Use Redis and Kafka</p></body></html>
    `;
    const text = run(html);
    expect(text).toContain("Golang Engineer");
    expect(text).toContain("Use Redis and Kafka");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color:red");
  });

  it("removes svg, iframe, and comments", () => {
    const html =
      "<!-- nav --><svg><path d='M0'/></svg><iframe src='x'></iframe><p>BIT</p>";
    const text = run(html);
    expect(text).toContain("BIT");
    expect(text).not.toContain("path");
    expect(text).not.toContain("iframe");
  });

  it("handles malformed HTML", () => {
    const text = run("<div><p>Open tag <b>bold Redis</div>");
    expect(text).toContain("Open tag");
    expect(text).toContain("bold Redis");
  });
});

import { describe, expect, it } from "vitest";
import { NormalizeFilter } from "../filters/normalize.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new NormalizeFilter().apply(createInitialContext(input)).text;
}

describe("NormalizeFilter", () => {
  it("converts CRLF to LF and collapses blank runs", () => {
    const result = run("a\r\n\r\n\r\n\r\nb");
    expect(result).toBe("a\n\n\nb");
  });

  it("normalizes NBSP and excess spaces", () => {
    expect(run("hello\u00a0\u00a0world")).toBe("hello world");
  });

  it("preserves technical punctuation", () => {
    expect(run("C++ / gRPC / ISO 8583")).toBe("C++ / gRPC / ISO 8583");
  });

  it("handles empty input", () => {
    expect(run("")).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { DuplicateFilter } from "../filters/duplicate.filter";
import { createInitialContext } from "../pipeline";

function run(input: string) {
  return new DuplicateFilter().apply(createInitialContext(input)).text;
}

describe("DuplicateFilter", () => {
  it("removes consecutive identical lines only", () => {
    const text = run("Redis\nRedis\nKafka\nRedis");
    expect(text).toBe("Redis\nKafka\nRedis");
  });

  it("collapses repeated blank lines", () => {
    expect(run("a\n\n\n\nb")).toBe("a\n\n\nb");
  });
});

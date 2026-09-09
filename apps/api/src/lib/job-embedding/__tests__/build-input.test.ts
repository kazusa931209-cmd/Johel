import { describe, expect, it } from "vitest";
import { buildJobEmbeddingInput, readJobTextFromJson } from "../build-input.js";

describe("buildJobEmbeddingInput", () => {
  it("prefers filteredJobText over raw jobText", () => {
    const jobJson = JSON.stringify({
      jobText: "raw posting",
      filteredJobText: "filtered posting",
    });
    expect(buildJobEmbeddingInput(jobJson)).toBe("filtered posting");
  });

  it("falls back to jobText when filteredJobText is empty", () => {
    const jobJson = JSON.stringify({
      jobText: "raw posting",
      filteredJobText: "   ",
    });
    expect(buildJobEmbeddingInput(jobJson)).toBe("raw posting");
  });

  it("returns null when no job text is present", () => {
    expect(buildJobEmbeddingInput(JSON.stringify({ method: "manual" }))).toBeNull();
    expect(readJobTextFromJson("not-json")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { hashJobEmbeddingSource } from "../source-hash.js";

describe("hashJobEmbeddingSource", () => {
  it("returns the same hash for the same trimmed text", () => {
    const first = hashJobEmbeddingSource("  hello world  ");
    const second = hashJobEmbeddingSource("hello world");
    expect(first).toBe(second);
  });

  it("returns different hashes for different text", () => {
    expect(hashJobEmbeddingSource("alpha")).not.toBe(hashJobEmbeddingSource("beta"));
  });
});

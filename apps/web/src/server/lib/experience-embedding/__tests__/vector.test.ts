import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  rankByCosine,
  serializeEmbeddingVector,
  deserializeEmbeddingVector,
} from "../vector";

describe("experience embedding vector", () => {
  it("round-trips float vectors through bytes", () => {
    const vector = [1, 0, 0, 0.5];
    const restored = deserializeEmbeddingVector(serializeEmbeddingVector(vector));
    expect(restored).toEqual(vector);
  });

  it("ranks candidates by cosine similarity", () => {
    const ranked = rankByCosine([1, 0, 0], [
      { id: "a", vector: [1, 0, 0] },
      { id: "b", vector: [0, 1, 0] },
      { id: "c", vector: [0.9, 0.1, 0] },
    ]);

    expect(ranked.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("returns 0 cosine for empty or mismatched vectors", () => {
    expect(cosineSimilarity([], [1])).toBe(0);
    expect(cosineSimilarity([1, 0], [1])).toBe(0);
  });
});

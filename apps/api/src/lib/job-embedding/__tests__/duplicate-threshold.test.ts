import { describe, expect, it } from "vitest";
import { rankByCosine } from "../../experience-embedding/vector.js";
import { JOB_DUPLICATE_SIMILARITY_THRESHOLD } from "../constants.js";

describe("JD duplicate threshold", () => {
  it("treats identical vectors as a match", () => {
    const vector = [0.2, 0.4, 0.8];
    const ranked = rankByCosine(vector, [
      { id: "peer-a", vector: [0.2, 0.4, 0.8] },
      { id: "peer-b", vector: [0.9, 0.1, 0.0] },
    ]);

    expect(ranked[0]?.id).toBe("peer-a");
    expect(ranked[0]?.score).toBeGreaterThanOrEqual(
      JOB_DUPLICATE_SIMILARITY_THRESHOLD,
    );
  });

  it("does not match orthogonal vectors", () => {
    const ranked = rankByCosine([1, 0, 0], [{ id: "peer-a", vector: [0, 1, 0] }]);
    expect(ranked[0]?.score ?? 0).toBeLessThan(JOB_DUPLICATE_SIMILARITY_THRESHOLD);
  });
});

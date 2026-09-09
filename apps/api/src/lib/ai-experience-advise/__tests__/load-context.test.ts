import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildExperienceAdviseFingerprintFromGraph } from "../load-context.js";
import type { ExperienceAdviseGraph } from "../types.js";

describe("buildExperienceAdviseFingerprintFromGraph", () => {
  it("hashes ordered id and updatedAt only", () => {
    const graph: ExperienceAdviseGraph = {
      targetExperienceId: null,
      experiences: [
        {
          id: "b",
          category: "B",
          problem: "p",
          actions: "a",
          outcome: "o",
          updatedAt: new Date("2026-09-02T00:00:00.000Z"),
        },
        {
          id: "a",
          category: "A",
          problem: "p",
          actions: "a",
          outcome: "o",
          updatedAt: new Date("2026-09-01T00:00:00.000Z"),
        },
      ],
    };

    const expected = createHash("sha256")
      .update(
        "a:2026-09-01T00:00:00.000Z|b:2026-09-02T00:00:00.000Z",
      )
      .digest("hex");

    expect(buildExperienceAdviseFingerprintFromGraph(graph)).toBe(expected);
  });
});

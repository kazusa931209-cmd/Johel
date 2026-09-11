import { describe, expect, it } from "vitest";
import {
  incrementGenerationPublicId,
  nextGenerationPublicId,
} from "../generation-public-id.js";

describe("nextGenerationPublicId", () => {
  const prefix = "GEN-20260911-";

  it("starts at 001 when no ids exist for the day", () => {
    expect(nextGenerationPublicId(prefix, [])).toBe("GEN-20260911-001");
  });

  it("uses the highest existing sequence, not row count", () => {
    expect(
      nextGenerationPublicId(prefix, [
        "GEN-20260911-001",
        "GEN-20260911-002",
        "GEN-20260911-004",
      ]),
    ).toBe("GEN-20260911-005");
  });

  it("ignores ids from other days", () => {
    expect(
      nextGenerationPublicId(prefix, [
        "GEN-20260910-099",
        "GEN-20260911-003",
      ]),
    ).toBe("GEN-20260911-004");
  });

  it("increments a colliding public id for retry", () => {
    expect(incrementGenerationPublicId("GEN-20260911-007")).toBe(
      "GEN-20260911-008",
    );
  });
});

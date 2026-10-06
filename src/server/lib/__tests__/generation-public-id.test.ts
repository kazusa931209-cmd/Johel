import { describe, expect, it } from "vitest";
import {
  incrementGenerationPublicId,
  nextGenerationPublicId,
  publicIdPrefixForKind,
} from "../generation-public-id";

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

describe("publicIdPrefixForKind", () => {
  it("uses GEN for general resume and JDR for JD resume", () => {
    const date = new Date("2026-09-11T12:00:00Z");
    expect(publicIdPrefixForKind("generalResume", date)).toBe("GEN-20260911-");
    expect(publicIdPrefixForKind("jdResume", date)).toBe("JDR-20260911-");
  });
});

import { describe, expect, it } from "vitest";
import {
  normalizeExperienceAdvisePoolDepth,
  resolveExperienceAdviseFullStarK,
  resolveExperienceAdviseIndexK,
} from "../pool-depth";

describe("pool-depth", () => {
  it("maps presets to full STAR counts", () => {
    expect(resolveExperienceAdviseFullStarK("compact")).toBe(5);
    expect(resolveExperienceAdviseFullStarK("normal")).toBe(10);
    expect(resolveExperienceAdviseFullStarK("thorough")).toBe(25);
    expect(resolveExperienceAdviseFullStarK("full")).toBeNull();
  });

  it("maps presets to compact index counts", () => {
    expect(resolveExperienceAdviseIndexK("compact")).toBe(20);
    expect(resolveExperienceAdviseIndexK("normal")).toBe(40);
    expect(resolveExperienceAdviseIndexK("thorough")).toBe(80);
    expect(resolveExperienceAdviseIndexK("full")).toBeNull();
  });

  it("falls back to normal for invalid values", () => {
    expect(normalizeExperienceAdvisePoolDepth("invalid")).toBe("normal");
  });
});

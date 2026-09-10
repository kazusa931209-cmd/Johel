import { describe, expect, it } from "vitest";
import {
  normalizeExperienceAdvisePoolDepth,
  resolveExperienceAdviseFullStarK,
} from "../pool-depth.js";

describe("pool-depth", () => {
  it("maps presets to full STAR counts", () => {
    expect(resolveExperienceAdviseFullStarK("compact")).toBe(5);
    expect(resolveExperienceAdviseFullStarK("normal")).toBe(10);
    expect(resolveExperienceAdviseFullStarK("thorough")).toBe(25);
    expect(resolveExperienceAdviseFullStarK("full")).toBeNull();
  });

  it("falls back to normal for invalid values", () => {
    expect(normalizeExperienceAdvisePoolDepth("invalid")).toBe("normal");
  });
});

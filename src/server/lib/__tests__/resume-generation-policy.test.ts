import { describe, expect, it } from "vitest";
import {
  buildCompanyTierContext,
  computeJdTierWeight,
  formatJdTierPercent,
  getCompanySceneCombineRules,
  getCompanySceneGenerateRules,
  getDimensionModePromptText,
  getJdTierCombineRules,
  getJdTierGenerateRules,
  normalizeExperienceDimensionMode,
  normalizeExperienceJdTierDecayPercent,
} from "../resume-generation-policy";

describe("computeJdTierWeight", () => {
  it("returns 100%, 80%, 64% for default 80% decay", () => {
    expect(computeJdTierWeight(0)).toBe(1);
    expect(computeJdTierWeight(1)).toBe(0.8);
    expect(computeJdTierWeight(2)).toBeCloseTo(0.64);
  });

  it("returns 100%, 50%, 25% for 50% decay", () => {
    expect(computeJdTierWeight(0, 50)).toBe(1);
    expect(computeJdTierWeight(1, 50)).toBe(0.5);
    expect(computeJdTierWeight(2, 50)).toBe(0.25);
  });
});

describe("formatJdTierPercent", () => {
  it("formats tier weights as percentages", () => {
    expect(formatJdTierPercent(1)).toBe("100%");
    expect(formatJdTierPercent(0.8)).toBe("80%");
    expect(formatJdTierPercent(0.25)).toBe("25%");
  });
});

describe("normalizeExperienceDimensionMode", () => {
  it("falls back to technical_facet for invalid values", () => {
    expect(normalizeExperienceDimensionMode("invalid")).toBe("technical_facet");
    expect(normalizeExperienceDimensionMode(null)).toBe("technical_facet");
  });

  it("accepts valid modes", () => {
    expect(normalizeExperienceDimensionMode("star_axis")).toBe("star_axis");
    expect(normalizeExperienceDimensionMode("problem_item")).toBe("problem_item");
  });
});

describe("normalizeExperienceJdTierDecayPercent", () => {
  it("falls back to 80 for invalid values", () => {
    expect(normalizeExperienceJdTierDecayPercent(null)).toBe(80);
    expect(normalizeExperienceJdTierDecayPercent(99)).toBe(80);
  });

  it("accepts valid presets", () => {
    expect(normalizeExperienceJdTierDecayPercent(30)).toBe(30);
    expect(normalizeExperienceJdTierDecayPercent(50)).toBe(50);
  });
});

describe("buildCompanyTierContext", () => {
  it("uses 1-based resume order index with default decay", () => {
    expect(buildCompanyTierContext(0)).toEqual({
      resumeOrderIndex: 1,
      jdTierWeight: 1,
      jdTierPercent: "100%",
    });
    expect(buildCompanyTierContext(1).jdTierPercent).toBe("80%");
    expect(buildCompanyTierContext(2).jdTierPercent).toBe("64%");
  });

  it("honors custom decay percent", () => {
    expect(buildCompanyTierContext(1, 50).jdTierPercent).toBe("50%");
  });
});

describe("getJdTierCombineRules", () => {
  it("includes dynamic tier order for decay percent", () => {
    const rules = getJdTierCombineRules(80);
    expect(rules).toContain("index 1 = 100%, index 2 = 80%, index 3 = 64%");
    expect(rules).not.toContain("1/2 JD tier");
  });
});

describe("getJdTierGenerateRules", () => {
  it("includes lower-tier coherence guidance", () => {
    const rules = getJdTierGenerateRules(80);
    expect(rules).toContain("coherent with the resume narrative");
    expect(rules).toContain("JD tier decay (80% per step)");
    expect(rules).toContain("Company scene grounding");
  });
});

describe("getCompanySceneCombineRules", () => {
  it("requires scene-fit card selection", () => {
    const rules = getCompanySceneCombineRules();
    expect(rules).toContain("Company scene fit");
    expect(rules).toContain("whatCompanyIs");
  });
});

describe("getCompanySceneGenerateRules", () => {
  it("requires scene-grounded bullet wording", () => {
    const rules = getCompanySceneGenerateRules();
    expect(rules).toContain("Company scene grounding");
    expect(rules).toContain("Illumina probes");
  });
});

describe("getDimensionModePromptText", () => {
  it("returns guidance for each mode", () => {
    expect(getDimensionModePromptText("star_axis")).toContain("STAR axis");
    expect(getDimensionModePromptText("jd_signal")).toContain("JD rubric signal");
    expect(getDimensionModePromptText("technical_facet")).toContain("technical facet");
    expect(getDimensionModePromptText("problem_item")).toContain("Problem bullet");
  });
});

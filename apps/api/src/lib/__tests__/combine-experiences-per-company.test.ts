import { describe, expect, it } from "vitest";
import {
  normalizeCombineExperiencesPerCompanyMax,
  resolveCombineExperiencesPerCompanyRange,
} from "../combine-experiences-per-company.js";

describe("combine-experiences-per-company", () => {
  it("normalizes invalid values to the default", () => {
    expect(normalizeCombineExperiencesPerCompanyMax(undefined)).toBe(5);
    expect(normalizeCombineExperiencesPerCompanyMax(99)).toBe(10);
    expect(normalizeCombineExperiencesPerCompanyMax(0)).toBe(1);
  });

  it("builds a 2–5 range by default", () => {
    expect(resolveCombineExperiencesPerCompanyRange(5)).toEqual({
      minPerCompany: 2,
      maxPerCompany: 5,
      thinOverlapMaxPerCompany: 2,
    });
  });

  it("builds a single-card range when max is 1", () => {
    expect(resolveCombineExperiencesPerCompanyRange(1)).toEqual({
      minPerCompany: 1,
      maxPerCompany: 1,
      thinOverlapMaxPerCompany: 1,
    });
  });
});

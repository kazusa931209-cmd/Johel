import { describe, expect, it } from "vitest";
import {
  normalizeCombineExperiencesPerCompanyMax,
  normalizeCombineExperiencesPerCompanyMin,
  resolveCombineExperiencesPerCompanyRange,
} from "../combine-experiences-per-company";

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

  it("uses an explicit min when provided", () => {
    expect(resolveCombineExperiencesPerCompanyRange(5, 1)).toEqual({
      minPerCompany: 1,
      maxPerCompany: 5,
      thinOverlapMaxPerCompany: 2,
    });
  });

  it("clamps min to max", () => {
    expect(normalizeCombineExperiencesPerCompanyMin(9, 3)).toBe(3);
  });
});

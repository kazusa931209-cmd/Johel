import { describe, expect, it } from "vitest";
import {
  countExperienceFieldBullets,
  getExperienceDensityStatus,
  isDenseExperience,
} from "../experience-density.js";

describe("experience-density", () => {
  it("counts markdown bullet lines", () => {
    expect(
      countExperienceFieldBullets({
        problem: "- **A**\n  One\n- **B**\n  Two",
        actions: "- **Act**\n  Did",
        outcome: "",
      }),
    ).toEqual({
      problem: 2,
      actions: 1,
      outcome: 0,
      total: 3,
    });
  });

  it("flags dense cards by threshold", () => {
    expect(
      isDenseExperience({
        problem: "- **One**\n  a\n- **Two**\n  b\n- **Three**\n  c\n- **Four**\n  d\n- **Five**\n  e",
        actions: "",
        outcome: "",
      }),
    ).toBe(true);

    expect(
      isDenseExperience({
        problem: "- **One**\n  a",
        actions: "- **Act**\n  b",
        outcome: "- **Out**\n  c",
      }),
    ).toBe(false);
  });

  it("reports exceeded fields in density status", () => {
    expect(
      getExperienceDensityStatus({
        problem: "",
        actions:
          "- **1**\n  a\n- **2**\n  b\n- **3**\n  c\n- **4**\n  d\n- **5**\n  e\n- **6**\n  f\n- **7**\n  g",
        outcome: "",
      }),
    ).toMatchObject({
      counts: { actions: 7, total: 7 },
      exceeded: { actions: true },
      isDense: true,
    });
  });
});

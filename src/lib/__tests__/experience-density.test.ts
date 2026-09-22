import { describe, expect, it } from "vitest";
import {
  getExperienceDensityStatus,
  isDenseExperience,
} from "@/lib/experience-density";

describe("experience-density", () => {
  it("matches API dense rules", () => {
    expect(
      isDenseExperience({
        problem: "",
        actions:
          "- **1**\n  a\n- **2**\n  b\n- **3**\n  c\n- **4**\n  d\n- **5**\n  e\n- **6**\n  f\n- **7**\n  g",
        outcome: "",
      }),
    ).toBe(true);
  });

  it("reports which fields exceed limits", () => {
    expect(
      getExperienceDensityStatus({
        problem:
          "- **One**\n  a\n- **Two**\n  b\n- **Three**\n  c\n- **Four**\n  d\n- **Five**\n  e",
        actions: "- **Act**\n  b",
        outcome: "- **Out**\n  c",
      }),
    ).toEqual({
      counts: { problem: 5, actions: 1, outcome: 1, total: 7 },
      exceeded: {
        problem: true,
        actions: false,
        outcome: false,
        total: false,
      },
      isDense: true,
    });
  });
});

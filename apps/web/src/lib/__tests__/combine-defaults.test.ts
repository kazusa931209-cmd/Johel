import { describe, expect, it } from "vitest";
import {
  applyCombineDefaults,
  extractCombineDefaults,
  isCombineSelectionEmpty,
  sanitizeCombineSelection,
  seedCombineFromDefaults,
} from "../combine-defaults";

describe("combine-defaults", () => {
  const emptyCombine = {
    profileId: "",
    language: "en",
    emphasis: "",
    companies: [],
  };

  it("detects empty combine selection", () => {
    expect(isCombineSelectionEmpty(emptyCombine)).toBe(true);
    expect(
      isCombineSelectionEmpty({
        ...emptyCombine,
        emphasis: "Tailor for leadership",
      }),
    ).toBe(true);
    expect(
      isCombineSelectionEmpty({
        ...emptyCombine,
        profileId: "prof-1",
      }),
    ).toBe(false);
  });

  it("extracts profile and company fields without experienceIds", () => {
    const defaults = extractCombineDefaults({
      profileId: "prof-1",
      language: "ko",
      emphasis: "Ignore me",
      companies: [
        {
          companyId: "co-1",
          startDate: "Jan 2022",
          endDate: "Present",
          roleContext: "Backend lead",
          keywordContext: "payments",
          experienceIds: ["exp-1", "exp-2"],
        },
      ],
    });

    expect(defaults).toEqual({
      profileId: "prof-1",
      companies: [
        {
          companyId: "co-1",
          startDate: "Jan 2022",
          endDate: "Present",
          roleContext: "Backend lead",
          keywordContext: "payments",
        },
      ],
    });
  });

  it("applies defaults without emphasis or experienceIds", () => {
    const seeded = applyCombineDefaults(
      { ...emptyCombine, language: "ja", emphasis: "Old guidance" },
      {
        profileId: "prof-1",
        companies: [
          {
            companyId: "co-1",
            startDate: "Jan 2022",
            endDate: "Present",
            roleContext: "Backend lead",
            keywordContext: "payments",
          },
        ],
      },
    );

    expect(seeded).toEqual({
      profileId: "prof-1",
      language: "ja",
      emphasis: "Old guidance",
      companies: [
        {
          companyId: "co-1",
          startDate: "Jan 2022",
          endDate: "Present",
          roleContext: "Backend lead",
          keywordContext: "payments",
          experienceIds: [],
        },
      ],
    });
  });

  it("does not seed when combine already has a selection", () => {
    const current = {
      ...emptyCombine,
      profileId: "prof-current",
    };
    expect(seedCombineFromDefaults(current, "user-1")).toBe(current);
  });

  it("sanitizes deleted profile and company references", () => {
    const combine = {
      profileId: "prof-missing",
      language: "en",
      emphasis: "",
      companies: [
        {
          companyId: "co-missing",
          startDate: "Jan 2022",
          endDate: "Present",
          roleContext: "Lead",
          keywordContext: "",
          experienceIds: [],
        },
      ],
    };

    expect(
      sanitizeCombineSelection(
        combine,
        new Set(["prof-1"]),
        new Set(["co-1"]),
      ),
    ).toEqual({
      ...combine,
      profileId: "",
      companies: [],
    });

    expect(
      sanitizeCombineSelection(
        {
          ...combine,
          profileId: "prof-1",
        },
        new Set(["prof-1"]),
        new Set(["co-1"]),
      ),
    ).toEqual({
      profileId: "prof-1",
      language: "en",
      emphasis: "",
      companies: [],
    });
  });
});

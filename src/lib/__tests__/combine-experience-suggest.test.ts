import { describe, expect, it } from "vitest";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  mergeExperienceSuggestions,
  mergeExperienceSuggestionsForCompany,
} from "../combine-experience-suggest";

describe("combine-experience-suggest", () => {
  const combine: CombineSnapshot = {
    profileId: "prof-1",
    language: "en",
    emphasis: "",
    companies: [
      {
        companyId: "co-1",
        startDate: "Jan 2022",
        endDate: "Present",
        roleContext: "Lead",
        keywordContext: "",
        experienceIds: ["exp-old-1"],
      },
      {
        companyId: "co-2",
        startDate: "Jan 2023",
        endDate: "Present",
        roleContext: "Staff",
        keywordContext: "",
        experienceIds: ["exp-old-2"],
      },
    ],
  };

  it("merges all company suggestions", () => {
    expect(
      mergeExperienceSuggestions(combine, {
        companies: [
          {
            companyId: "co-1",
            experienceIds: ["exp-new-1"],
            rationale: "A",
          },
          {
            companyId: "co-2",
            experienceIds: ["exp-new-2"],
            rationale: "B",
          },
        ],
        warnings: [],
        tokenUsed: 1,
      }),
    ).toEqual([
      {
        ...combine.companies[0],
        experienceIds: ["exp-new-1"],
      },
      {
        ...combine.companies[1],
        experienceIds: ["exp-new-2"],
      },
    ]);
  });

  it("merges a single company suggestion without touching others", () => {
    expect(
      mergeExperienceSuggestionsForCompany(
        combine,
        {
          companies: [
            {
              companyId: "co-1",
              experienceIds: ["exp-new-1"],
              rationale: "A",
            },
          ],
          warnings: [],
          tokenUsed: 1,
        },
        "co-1",
      ),
    ).toEqual([
      {
        ...combine.companies[0],
        experienceIds: ["exp-new-1"],
      },
      combine.companies[1],
    ]);
  });
});

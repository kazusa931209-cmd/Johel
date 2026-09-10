import { describe, expect, it } from "vitest";
import { isCombineRunReady } from "@/components/generate/combine-types";

describe("isCombineRunReady", () => {
  const graduation = { year: 2020, month: 6 };

  it("returns false when profile or companies are missing", () => {
    expect(
      isCombineRunReady(
        {
          profileId: "",
          language: "en",
          emphasis: "",
          companies: [],
        },
        graduation,
      ),
    ).toBe(false);
  });

  it("returns false when required company fields are incomplete", () => {
    expect(
      isCombineRunReady(
        {
          profileId: "prof-1",
          language: "en",
          emphasis: "",
          companies: [
            {
              companyId: "co-1",
              startDate: "Jan 2022",
              endDate: "Present",
              roleContext: "",
              keywordContext: "",
              experienceIds: ["exp-1"],
            },
          ],
        },
        graduation,
      ),
    ).toBe(false);
  });

  it("returns false when no experiences are linked", () => {
    expect(
      isCombineRunReady(
        {
          profileId: "prof-1",
          language: "en",
          emphasis: "",
          companies: [
            {
              companyId: "co-1",
              startDate: "Jan 2022",
              endDate: "Present",
              roleContext: "Backend lead",
              keywordContext: "",
              experienceIds: [],
            },
          ],
        },
        graduation,
      ),
    ).toBe(false);
  });

  it("returns true when combine is valid and at least one experience is linked", () => {
    expect(
      isCombineRunReady(
        {
          profileId: "prof-1",
          language: "en",
          emphasis: "",
          companies: [
            {
              companyId: "co-1",
              startDate: "Jan 2022",
              endDate: "Present",
              roleContext: "Backend lead",
              keywordContext: "payments",
              experienceIds: ["exp-1"],
            },
          ],
        },
        graduation,
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildPeriodWindow,
  defaultChainedPeriodIndices,
  defaultPeriodIndices,
  periodEndOverlapsPriorStart,
  reclampCombineCompanyPeriods,
} from "@/lib/combine-period";

describe("defaultChainedPeriodIndices", () => {
  it("ends the month before prior start and spans up to 24 months", () => {
    const window = buildPeriodWindow(2018, 1);
    const chained = defaultChainedPeriodIndices(window, 30);
    expect(chained.endIndex).toBe(29);
    expect(chained.startIndex).toBe(6);
  });

  it("collapses to a single month when prior starts at graduation", () => {
    const window = buildPeriodWindow(2020, 1);
    const chained = defaultChainedPeriodIndices(window, 0);
    expect(chained).toEqual({ startIndex: 0, endIndex: 0 });
  });
});

describe("periodEndOverlapsPriorStart", () => {
  it("is false when end equals prior start", () => {
    expect(periodEndOverlapsPriorStart(10, 10)).toBe(false);
  });

  it("is true when end is after prior start", () => {
    expect(periodEndOverlapsPriorStart(11, 10)).toBe(true);
  });
});

describe("defaultPeriodIndices", () => {
  it("defaults first company to recent window ending at present", () => {
    const window = buildPeriodWindow(2015, 1);
    const defaults = defaultPeriodIndices(window);
    expect(defaults.endIndex).toBe(window.maxIndex);
  });
});

describe("buildPeriodWindow", () => {
  it("starts the window at the profile graduation month", () => {
    const window = buildPeriodWindow(2020, 6);
    expect(window.graduationMonth).toBe(6);
    expect(window.monthCount).toBeGreaterThan(0);
  });
});

describe("reclampCombineCompanyPeriods", () => {
  it("keeps non-period fields and reclamps dates to the new graduation window", () => {
    const companies = [
      {
        companyId: "co-1",
        startDate: "Jan 2020",
        endDate: "Present",
        roleContext: "Backend lead",
        keywordContext: "payments",
        experienceIds: ["exp-1", "exp-2"],
      },
    ];

    const reclamped = reclampCombineCompanyPeriods(
      companies,
      { year: 2018, month: 1 },
      "en",
    );

    expect(reclamped[0]?.companyId).toBe("co-1");
    expect(reclamped[0]?.roleContext).toBe("Backend lead");
    expect(reclamped[0]?.keywordContext).toBe("payments");
    expect(reclamped[0]?.experienceIds).toEqual(["exp-1", "exp-2"]);
    expect(reclamped[0]?.startDate).toBeTruthy();
    expect(reclamped[0]?.endDate).toBe("Present");
  });

  it("assigns default periods when dates are empty", () => {
    const companies = [
      {
        companyId: "co-1",
        startDate: "",
        endDate: "",
        roleContext: "Engineer",
        keywordContext: "",
        experienceIds: [],
      },
    ];

    const reclamped = reclampCombineCompanyPeriods(
      companies,
      { year: 2020, month: 1 },
      "en",
    );

    expect(reclamped[0]?.startDate).toBeTruthy();
    expect(reclamped[0]?.endDate).toBe("Present");
  });
});

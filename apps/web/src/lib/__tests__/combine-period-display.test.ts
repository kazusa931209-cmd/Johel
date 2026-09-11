import { describe, expect, it } from "vitest";
import type { CombineCompanyEntry } from "@/components/generate/combine-types";
import {
  buildPeriodWindow,
  indicesToPeriod,
} from "@/lib/combine-period";
import {
  formatCompanyPeriodDisplay,
  formatPeriodDurationLabel,
  formatPeriodDurationShortLabel,
  formatPeriodDurationYmLabel,
  inclusiveMonthCountFromPeriodLabels,
  sumCombineCompaniesPeriodMonths,
} from "@/lib/combine-period-display";

const t = (key: string, params?: Record<string, string>) => {
  if (key === "generate.combine.periodDurationOneYear") return "1 year";
  if (key === "generate.combine.periodDurationYears") {
    return `${params?.count} years`;
  }
  if (key === "generate.combine.periodDurationOneMonth") return "1 month";
  if (key === "generate.combine.periodDurationMonths") {
    return `${params?.count} months`;
  }
  if (key === "generate.combine.periodDurationShortYears") {
    return `${params?.count}y`;
  }
  if (key === "generate.combine.periodDurationShortMonths") {
    return `${params?.count}m`;
  }
  return key;
};

describe("formatPeriodDurationLabel", () => {
  it("formats one month", () => {
    expect(formatPeriodDurationLabel(1, t)).toBe("1 month");
  });

  it("formats years and months", () => {
    expect(formatPeriodDurationLabel(21, t)).toBe("1 year 9 months");
  });

  it("formats whole years only", () => {
    expect(formatPeriodDurationLabel(24, t)).toBe("2 years");
  });
});

describe("formatPeriodDurationYmLabel", () => {
  it("formats compact y/m tenure", () => {
    expect(formatPeriodDurationYmLabel(21)).toBe("1y 9m");
    expect(formatPeriodDurationYmLabel(24)).toBe("2y");
    expect(formatPeriodDurationYmLabel(0)).toBe("0m");
  });
});

describe("sumCombineCompaniesPeriodMonths", () => {
  it("sums included company periods", () => {
    const window = buildPeriodWindow(2020, 1);
    const first = indicesToPeriod(window, window.maxIndex - 20, window.maxIndex, "en");
    const second = indicesToPeriod(
      window,
      window.maxIndex - 11,
      window.maxIndex - 2,
      "en",
    );
    const companies: CombineCompanyEntry[] = [
      {
        companyId: "a",
        startDate: first.startDate,
        endDate: first.endDate,
        roleContext: "Backend",
        keywordContext: "",
        experienceIds: [],
      },
      {
        companyId: "b",
        startDate: second.startDate,
        endDate: second.endDate,
        roleContext: "Platform",
        keywordContext: "",
        experienceIds: [],
      },
    ];

    expect(
      sumCombineCompaniesPeriodMonths(
        companies,
        { year: 2020, month: 1 },
        "en",
      ),
    ).toBe(21 + 10);
  });
});

describe("formatPeriodDurationShortLabel", () => {
  it("formats compact years and months", () => {
    expect(formatPeriodDurationShortLabel(21, t)).toBe("1y 9m");
  });

  it("formats compact whole years only", () => {
    expect(formatPeriodDurationShortLabel(24, t)).toBe("2y");
  });
});

describe("formatCompanyPeriodDisplay", () => {
  it("includes inclusive short duration after the period range", () => {
    const window = buildPeriodWindow(2020, 1);
    const period = indicesToPeriod(window, window.maxIndex - 20, window.maxIndex, "en");
    const monthCount = inclusiveMonthCountFromPeriodLabels(
      window,
      period.startDate,
      period.endDate,
      "en",
    );

    expect(monthCount).toBe(21);
    expect(
      formatCompanyPeriodDisplay(
        period.startDate,
        period.endDate,
        { year: 2020, month: 1 },
        "en",
        t,
      ),
    ).toBe(`${period.startDate} – ${period.endDate} (1y 9m)`);
  });
});

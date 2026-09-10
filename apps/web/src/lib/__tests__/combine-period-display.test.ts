import { describe, expect, it } from "vitest";
import {
  buildPeriodWindow,
  indicesToPeriod,
} from "@/lib/combine-period";
import {
  formatCompanyPeriodDisplay,
  formatPeriodDurationLabel,
  formatPeriodDurationShortLabel,
  inclusiveMonthCountFromPeriodLabels,
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

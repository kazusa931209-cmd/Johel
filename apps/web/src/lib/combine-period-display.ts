import { formatCompanyPeriod } from "@/components/generate/combine-types";
import {
  buildPeriodWindow,
  labelsToMonthIndices,
  type PeriodWindow,
} from "@/lib/combine-period";
import { formatThousandsSeparated } from "@/lib/helper";
import type { ProfileGraduation } from "@/lib/profile";

export function inclusiveMonthCountFromPeriodLabels(
  window: PeriodWindow,
  startDate: string,
  endDate: string,
  locale: string,
): number {
  const { startIndex, endIndex } = labelsToMonthIndices(
    window,
    startDate,
    endDate,
    locale,
  );
  return Math.max(1, endIndex - startIndex + 1);
}

export function formatPeriodDurationLabel(
  monthCount: number,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  const count = Math.max(1, monthCount);
  const years = Math.floor(count / 12);
  const months = count % 12;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(
      years === 1
        ? t("generate.combine.periodDurationOneYear")
        : t("generate.combine.periodDurationYears", {
            count: formatThousandsSeparated(years),
          }),
    );
  }
  if (months > 0) {
    parts.push(
      months === 1
        ? t("generate.combine.periodDurationOneMonth")
        : t("generate.combine.periodDurationMonths", {
            count: formatThousandsSeparated(months),
          }),
    );
  }

  return parts.join(" ") || t("generate.combine.periodDurationOneMonth");
}

export function formatPeriodDurationShortLabel(
  monthCount: number,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  const count = Math.max(1, monthCount);
  const years = Math.floor(count / 12);
  const months = count % 12;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(
      t("generate.combine.periodDurationShortYears", {
        count: formatThousandsSeparated(years),
      }),
    );
  }
  if (months > 0) {
    parts.push(
      t("generate.combine.periodDurationShortMonths", {
        count: formatThousandsSeparated(months),
      }),
    );
  }

  return (
    parts.join(" ") ||
    t("generate.combine.periodDurationShortMonths", {
      count: formatThousandsSeparated(1),
    })
  );
}

export type CompanyPeriodDisplayParts = {
  range: string;
  durationShort: string | null;
};

export function resolveCompanyPeriodDisplayParts(
  startDate: string,
  endDate: string,
  profileGraduation: ProfileGraduation | null,
  locale: string,
  t: (key: string, params?: Record<string, string>) => string,
): CompanyPeriodDisplayParts {
  const range = formatCompanyPeriod(startDate, endDate);
  if (!profileGraduation) {
    return { range, durationShort: null };
  }

  const window = buildPeriodWindow(
    profileGraduation.year,
    profileGraduation.month,
  );
  const monthCount = inclusiveMonthCountFromPeriodLabels(
    window,
    startDate,
    endDate,
    locale,
  );

  return {
    range,
    durationShort: formatPeriodDurationShortLabel(monthCount, t),
  };
}

/** @deprecated Use `resolveCompanyPeriodDisplayParts` with `CombinePeriodDisplay`. */
export function formatCompanyPeriodDisplay(
  startDate: string,
  endDate: string,
  profileGraduation: ProfileGraduation | null,
  locale: string,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  const { range, durationShort } = resolveCompanyPeriodDisplayParts(
    startDate,
    endDate,
    profileGraduation,
    locale,
    t,
  );
  if (!durationShort) {
    return range;
  }
  return `${range} (${durationShort})`;
}

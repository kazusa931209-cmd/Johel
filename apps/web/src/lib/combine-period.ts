export const COMBINE_PRESENT_LABEL = "Present";

const EN_MONTH_YEAR = "en-US";

export type PeriodWindow = {
  graduationYear: number;
  /** 1–12 */
  graduationMonth: number;
  monthCount: number;
  maxIndex: number;
};

function currentMonthAnchor(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthsBetweenInclusive(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): number {
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

export function buildPeriodWindow(
  graduationYear: number,
  graduationMonth: number,
): PeriodWindow {
  const startMonth = graduationMonth - 1;
  const current = currentMonthAnchor();
  const monthCount = Math.max(
    1,
    monthsBetweenInclusive(
      graduationYear,
      startMonth,
      current.year,
      current.month,
    ),
  );
  return {
    graduationYear,
    graduationMonth,
    monthCount,
    maxIndex: monthCount - 1,
  };
}

function monthIndexToDate(window: PeriodWindow, index: number): Date {
  const startMonth = window.graduationMonth - 1;
  const absoluteMonth = startMonth + index;
  const year = window.graduationYear + Math.floor(absoluteMonth / 12);
  const month = absoluteMonth % 12;
  return new Date(year, month, 1);
}

function intlLocale(locale: string): string {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  if (locale === "zh-TW") return "zh-TW";
  if (locale === "zh-CN") return "zh-CN";
  return EN_MONTH_YEAR;
}

export function formatMonthYear(
  year: number,
  month: number,
  locale: string,
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

export function monthIndexToStartLabel(
  window: PeriodWindow,
  index: number,
  locale: string,
): string {
  const date = monthIndexToDate(window, index);
  return formatMonthYear(date.getFullYear(), date.getMonth(), locale);
}

export function monthIndexToEndLabel(
  window: PeriodWindow,
  index: number,
  locale: string,
): string {
  if (index >= window.maxIndex) {
    return COMBINE_PRESENT_LABEL;
  }
  const date = monthIndexToDate(window, index);
  return formatMonthYear(date.getFullYear(), date.getMonth(), locale);
}

export function defaultPeriodIndices(window: PeriodWindow): {
  startIndex: number;
  endIndex: number;
} {
  return {
    startIndex: Math.max(0, window.maxIndex - Math.min(23, window.maxIndex)),
    endIndex: window.maxIndex,
  };
}

/** Default period for a company selected after another: ends before prior start. */
export function defaultChainedPeriodIndices(
  window: PeriodWindow,
  priorStartIndex: number,
): { startIndex: number; endIndex: number } {
  const endIndex = Math.max(0, priorStartIndex - 1);
  const startIndex = Math.max(0, endIndex - Math.min(23, endIndex));
  return { startIndex, endIndex };
}

/** True when this company's end month is after the prior company's start month. */
export function periodEndOverlapsPriorStart(
  endIndex: number,
  priorStartIndex: number,
): boolean {
  return endIndex > priorStartIndex;
}

export function indicesToPeriod(
  window: PeriodWindow,
  startIndex: number,
  endIndex: number,
  locale: string,
): { startDate: string; endDate: string } {
  const clampedStart = clampIndex(window, startIndex);
  const clampedEnd = clampIndex(window, endIndex);
  const start = Math.min(clampedStart, clampedEnd);
  const end = Math.max(clampedStart, clampedEnd);
  return {
    startDate: monthIndexToStartLabel(window, start, locale),
    endDate: monthIndexToEndLabel(window, end, locale),
  };
}

function clampIndex(window: PeriodWindow, index: number): number {
  return Math.min(Math.max(0, index), window.maxIndex);
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function labelMatchesIndex(
  window: PeriodWindow,
  label: string,
  index: number,
  locale: string,
): boolean {
  const normalized = normalizeLabel(label);
  if (!normalized) return false;
  if (normalized === "present" && index === window.maxIndex) {
    return true;
  }
  return (
    normalizeLabel(monthIndexToStartLabel(window, index, locale)) ===
      normalized ||
    normalizeLabel(monthIndexToStartLabel(window, index, EN_MONTH_YEAR)) ===
      normalized
  );
}

export function labelsToMonthIndices(
  window: PeriodWindow,
  startLabel: string,
  endLabel: string,
  locale: string,
): { startIndex: number; endIndex: number } {
  const defaults = defaultPeriodIndices(window);
  let startIndex = defaults.startIndex;
  let endIndex = defaults.endIndex;

  for (let index = 0; index <= window.maxIndex; index += 1) {
    if (labelMatchesIndex(window, startLabel, index, locale)) {
      startIndex = index;
      break;
    }
  }

  for (let index = window.maxIndex; index >= 0; index -= 1) {
    if (labelMatchesIndex(window, endLabel, index, locale)) {
      endIndex = index;
      break;
    }
  }

  if (startIndex > endIndex) {
    return defaults;
  }

  return { startIndex, endIndex };
}

export function formatPeriodRangeLabel(
  window: PeriodWindow,
  startIndex: number,
  endIndex: number,
  locale: string,
): string {
  return `${monthIndexToStartLabel(window, startIndex, locale)} – ${monthIndexToEndLabel(window, endIndex, locale)}`;
}

export function clampPeriodToWindow(
  window: PeriodWindow,
  startDate: string,
  endDate: string,
  locale: string,
): { startDate: string; endDate: string } {
  const { startIndex, endIndex } = labelsToMonthIndices(
    window,
    startDate,
    endDate,
    locale,
  );
  return indicesToPeriod(window, startIndex, endIndex, locale);
}

export type CombinePeriodEntry = {
  startDate: string;
  endDate: string;
};

/** Re-clamp each company period to a profile graduation window; other fields stay unchanged. */
export function reclampCombineCompanyPeriods<T extends CombinePeriodEntry>(
  companies: T[],
  graduation: { year: number; month: number },
  locale: string,
): T[] {
  const window = buildPeriodWindow(graduation.year, graduation.month);
  return companies.map((entry) => {
    if (!entry.startDate.trim() || !entry.endDate.trim()) {
      const { startIndex, endIndex } = defaultPeriodIndices(window);
      const period = indicesToPeriod(window, startIndex, endIndex, locale);
      return { ...entry, startDate: period.startDate, endDate: period.endDate };
    }
    const period = clampPeriodToWindow(
      window,
      entry.startDate,
      entry.endDate,
      locale,
    );
    return { ...entry, startDate: period.startDate, endDate: period.endDate };
  });
}

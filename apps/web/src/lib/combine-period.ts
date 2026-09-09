/** Ten-year month window ending at the current month (120 months, indices 0–119). */
export const COMBINE_PERIOD_MONTH_COUNT = 120;

export const COMBINE_PRESENT_LABEL = "Present";

const EN_MONTH_YEAR = "en-US";

function windowAnchorDate(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() - (COMBINE_PERIOD_MONTH_COUNT - 1),
    1,
  );
}

function monthIndexToDate(index: number): Date {
  const anchor = windowAnchorDate();
  return new Date(anchor.getFullYear(), anchor.getMonth() + index, 1);
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

export function monthIndexToStartLabel(index: number, locale: string): string {
  const date = monthIndexToDate(index);
  return formatMonthYear(date.getFullYear(), date.getMonth(), locale);
}

export function monthIndexToEndLabel(index: number, locale: string): string {
  if (index >= COMBINE_PERIOD_MONTH_COUNT - 1) {
    return COMBINE_PRESENT_LABEL;
  }
  const date = monthIndexToDate(index);
  return formatMonthYear(date.getFullYear(), date.getMonth(), locale);
}

export function defaultPeriodIndices(): {
  startIndex: number;
  endIndex: number;
} {
  return {
    startIndex: Math.max(0, COMBINE_PERIOD_MONTH_COUNT - 24),
    endIndex: COMBINE_PERIOD_MONTH_COUNT - 1,
  };
}

export function indicesToPeriod(
  startIndex: number,
  endIndex: number,
  locale: string,
): { startDate: string; endDate: string } {
  return {
    startDate: monthIndexToStartLabel(startIndex, locale),
    endDate: monthIndexToEndLabel(endIndex, locale),
  };
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function labelMatchesIndex(label: string, index: number, locale: string): boolean {
  const normalized = normalizeLabel(label);
  if (!normalized) return false;
  if (
    normalized === "present" &&
    index === COMBINE_PERIOD_MONTH_COUNT - 1
  ) {
    return true;
  }
  return (
    normalizeLabel(monthIndexToStartLabel(index, locale)) === normalized ||
    normalizeLabel(monthIndexToStartLabel(index, EN_MONTH_YEAR)) === normalized
  );
}

export function labelsToMonthIndices(
  startLabel: string,
  endLabel: string,
  locale: string,
): { startIndex: number; endIndex: number } {
  const defaults = defaultPeriodIndices();
  let startIndex = defaults.startIndex;
  let endIndex = defaults.endIndex;

  for (let index = 0; index < COMBINE_PERIOD_MONTH_COUNT; index += 1) {
    if (labelMatchesIndex(startLabel, index, locale)) {
      startIndex = index;
      break;
    }
  }

  for (let index = COMBINE_PERIOD_MONTH_COUNT - 1; index >= 0; index -= 1) {
    if (labelMatchesIndex(endLabel, index, locale)) {
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
  startIndex: number,
  endIndex: number,
  locale: string,
): string {
  return `${monthIndexToStartLabel(startIndex, locale)} – ${monthIndexToEndLabel(endIndex, locale)}`;
}

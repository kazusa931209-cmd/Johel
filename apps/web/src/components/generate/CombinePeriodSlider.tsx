"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import {
  COMBINE_PERIOD_MONTH_COUNT,
  formatPeriodRangeLabel,
  indicesToPeriod,
  labelsToMonthIndices,
} from "@/lib/combine-period";

type CombinePeriodSliderProps = {
  startDate: string;
  endDate: string;
  onChange: (period: { startDate: string; endDate: string }) => void;
};

export function CombinePeriodSlider({
  startDate,
  endDate,
  onChange,
}: CombinePeriodSliderProps) {
  const t = useT();
  const { locale } = useLocale();
  const parsedIndices = useMemo(
    () => labelsToMonthIndices(startDate, endDate, locale),
    [startDate, endDate, locale],
  );
  const [startIndex, setStartIndex] = useState(parsedIndices.startIndex);
  const [endIndex, setEndIndex] = useState(parsedIndices.endIndex);

  useEffect(() => {
    setStartIndex(parsedIndices.startIndex);
    setEndIndex(parsedIndices.endIndex);
  }, [parsedIndices.endIndex, parsedIndices.startIndex]);

  const maxIndex = COMBINE_PERIOD_MONTH_COUNT - 1;
  const safeStart = Math.min(startIndex, endIndex);
  const safeEnd = Math.max(startIndex, endIndex);

  function emitPeriod(nextStart: number, nextEnd: number) {
    const start = Math.min(nextStart, nextEnd);
    const end = Math.max(nextStart, nextEnd);
    setStartIndex(start);
    setEndIndex(end);
    onChange(indicesToPeriod(start, end, locale));
  }

  const rangeLabel = formatPeriodRangeLabel(safeStart, safeEnd, locale);
  const startPercent = (safeStart / maxIndex) * 100;
  const endPercent = (safeEnd / maxIndex) * 100;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{rangeLabel}</p>
      <div className="relative h-8 pt-3">
        <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-surface-muted" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-foreground/70"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(endPercent - startPercent, 0)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={safeStart}
          onChange={(event) =>
            emitPeriod(Number(event.target.value), safeEnd)
          }
          className="combine-period-range combine-period-range-start absolute inset-0 z-20 w-full appearance-none bg-transparent"
          aria-label={t("generate.combine.periodStartAria", { label: rangeLabel })}
        />
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={safeEnd}
          onChange={(event) =>
            emitPeriod(safeStart, Number(event.target.value))
          }
          className="combine-period-range combine-period-range-end absolute inset-0 z-30 w-full appearance-none bg-transparent"
          aria-label={t("generate.combine.periodEndAria", { label: rangeLabel })}
        />
      </div>
    </div>
  );
}

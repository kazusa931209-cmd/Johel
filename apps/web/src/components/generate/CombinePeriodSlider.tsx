"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import {
  buildPeriodWindow,
  formatPeriodRangeLabel,
  indicesToPeriod,
  labelsToMonthIndices,
  periodEndOverlapsPriorStart,
} from "@/lib/combine-period";

type CombinePeriodSliderProps = {
  graduationYear: number;
  startDate: string;
  endDate: string;
  onChange: (period: { startDate: string; endDate: string }) => void;
  /** Prior selected company's start month index (chain constraint). */
  priorStartIndex?: number | null;
};

export function CombinePeriodSlider({
  graduationYear,
  startDate,
  endDate,
  onChange,
  priorStartIndex = null,
}: CombinePeriodSliderProps) {
  const t = useT();
  const { locale } = useLocale();
  const window = useMemo(
    () => buildPeriodWindow(graduationYear),
    [graduationYear],
  );
  const parsedIndices = useMemo(
    () => labelsToMonthIndices(window, startDate, endDate, locale),
    [window, startDate, endDate, locale],
  );
  const [startIndex, setStartIndex] = useState(parsedIndices.startIndex);
  const [endIndex, setEndIndex] = useState(parsedIndices.endIndex);

  useEffect(() => {
    setStartIndex(parsedIndices.startIndex);
    setEndIndex(parsedIndices.endIndex);
  }, [parsedIndices.endIndex, parsedIndices.startIndex]);

  const safeStart = Math.min(startIndex, endIndex);
  const safeEnd = Math.max(startIndex, endIndex);

  function emitPeriod(nextStart: number, nextEnd: number) {
    const start = Math.min(nextStart, nextEnd);
    const end = Math.max(nextStart, nextEnd);
    setStartIndex(start);
    setEndIndex(end);
    onChange(indicesToPeriod(window, start, end, locale));
  }

  const rangeLabel = formatPeriodRangeLabel(window, safeStart, safeEnd, locale);
  const startPercent =
    window.maxIndex > 0 ? (safeStart / window.maxIndex) * 100 : 0;
  const endPercent =
    window.maxIndex > 0 ? (safeEnd / window.maxIndex) * 100 : 100;
  const overlapWarning =
    priorStartIndex != null &&
    periodEndOverlapsPriorStart(safeEnd, priorStartIndex);

  return (
    <div
      className={`space-y-2 ${overlapWarning ? "combine-period-overlap" : ""}`}
    >
      <div className="relative h-8 pt-3">
        <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-[var(--period-track)]" />
        <div
          className="combine-period-range-fill absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--period-range)]"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(endPercent - startPercent, 0)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={window.maxIndex}
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
          max={window.maxIndex}
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

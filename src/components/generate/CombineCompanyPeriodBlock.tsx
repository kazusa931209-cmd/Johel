"use client";

import { memo, useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { CombinePeriodDisplay } from "@/components/generate/CombinePeriodDisplay";
import { CombinePeriodSlider } from "@/components/generate/CombinePeriodSlider";
import type { ProfileGraduation } from "@/lib/profile";

type CombineCompanyPeriodBlockProps = {
  companyId: string;
  startDate: string;
  endDate: string;
  priorStartIndex: number | null;
  profileGraduation: ProfileGraduation;
  onPeriodChange: (
    companyId: string,
    period: { startDate: string; endDate: string },
  ) => void;
};

export const CombineCompanyPeriodBlock = memo(function CombineCompanyPeriodBlock({
  companyId,
  startDate,
  endDate,
  priorStartIndex,
  profileGraduation,
  onPeriodChange,
}: CombineCompanyPeriodBlockProps) {
  const t = useT();
  const [previewPeriod, setPreviewPeriod] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  useEffect(() => {
    setPreviewPeriod(null);
  }, [startDate, endDate]);

  const displayStartDate = previewPeriod?.startDate ?? startDate;
  const displayEndDate = previewPeriod?.endDate ?? endDate;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-sm">
          {t("generate.combine.period")}
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        </span>
        <CombinePeriodDisplay
          startDate={displayStartDate}
          endDate={displayEndDate}
          profileGraduation={profileGraduation}
          className="text-sm font-medium"
        />
      </div>
      <CombinePeriodSlider
        graduationYear={profileGraduation.year}
        graduationMonth={profileGraduation.month}
        startDate={startDate}
        endDate={endDate}
        priorStartIndex={priorStartIndex}
        onPreviewChange={setPreviewPeriod}
        onChange={(period) => {
          setPreviewPeriod(null);
          onPeriodChange(companyId, period);
        }}
      />
    </div>
  );
});

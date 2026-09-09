"use client";

import { useMemo } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GenerateJobDescriptionPreview } from "@/components/generate/GenerateJobDescriptionPreview";
import { formatThousandsSeparated } from "@/lib/helper";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";

type GenerateJobContextPanelContentProps = {
  job: GenerateJobState;
};

export function GenerateJobContextPanelContent({
  job,
}: GenerateJobContextPanelContentProps) {
  const t = useT();
  const filteredCharCount = useMemo(
    () =>
      formatThousandsSeparated(noiseFilter(job.jobText.trim()).text.length),
    [job.jobText],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("generate.job.title")}
        </h2>
        <p className="text-sm text-muted">{t("generate.job.filteredPreviewHint")}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">
            {t("generate.job.filteredPreviewTitle")}
          </h3>
          <span
            className="text-xs tabular-nums text-muted"
            aria-label={t("generate.job.filteredCharCountAria", {
              count: filteredCharCount,
            })}
          >
            {filteredCharCount}
          </span>
        </div>
        <div className="rounded-md border border-border bg-background px-3 py-3">
          <GenerateJobDescriptionPreview jobText={job.jobText} />
        </div>
      </div>
    </div>
  );
}

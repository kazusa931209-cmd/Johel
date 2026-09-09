"use client";

import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateVerdictPanelContentProps = {
  job: GenerateJobState;
};

export function GenerateVerdictPanelContent({
  job,
}: GenerateVerdictPanelContentProps) {
  const t = useT();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("generate.verdict.description")}</p>

      {job.acceptedMarkdown ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("generate.verdict.result.title")}
          </h3>
          <p className="text-xs text-muted">
            {t("generate.verdict.result.description")}
          </p>
          <div className="rounded-md border border-border bg-background px-3 py-3">
            <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("generate.verdict.pending")}</p>
      )}
    </div>
  );
}

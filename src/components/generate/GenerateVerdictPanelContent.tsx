"use client";

import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import {
  GenerateJdMetaFields,
  type GenerateJdMetaFieldErrors,
} from "@/components/generate/GenerateJdMetaFields";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateVerdictPanelContentProps = {
  job: GenerateJobState;
  onJobChange: (job: GenerateJobState) => void;
  jdMetaErrors?: GenerateJdMetaFieldErrors;
};

export function GenerateVerdictPanelContent({
  job,
  onJobChange,
  jdMetaErrors,
}: GenerateVerdictPanelContentProps) {
  const t = useT();

  return (
    <div className="space-y-6">
      <GenerateJdMetaFields
        jdCompanyName={job.jdCompanyName}
        jdJobRole={job.jdJobRole}
        onChange={(patch) => onJobChange({ ...job, ...patch })}
        errors={jdMetaErrors}
      />

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

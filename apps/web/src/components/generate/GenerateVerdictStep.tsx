"use client";

import { useCallback, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GenerateVerdictPanelContent } from "@/components/generate/GenerateVerdictPanelContent";
import type { GenerateJdMetaFieldErrors } from "@/lib/jd-meta-validation";
import { validateGenerateJdMetaFields } from "@/lib/jd-meta-validation";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateVerdictStepProps = {
  job: GenerateJobState;
  onJobChange: (job: GenerateJobState) => void;
  running: boolean;
  onRun: () => void;
};

export function GenerateVerdictStep({
  job,
  onJobChange,
  running,
  onRun,
}: GenerateVerdictStepProps) {
  const t = useT();
  const [jdMetaErrors, setJdMetaErrors] = useState<GenerateJdMetaFieldErrors>(
    {},
  );

  const handleRun = useCallback(() => {
    const errors = validateGenerateJdMetaFields(
      job.jdCompanyName,
      job.jdJobRole,
      t,
    );
    if (Object.keys(errors).length > 0) {
      setJdMetaErrors(errors);
      return;
    }
    setJdMetaErrors({});
    onRun();
  }, [job.jdCompanyName, job.jdJobRole, onRun, t]);

  useRegisterGenerateStepNav({
    onRun: running ? undefined : handleRun,
    runBusy: running,
  });

  return (
    <>
      <GenerateVerdictPanelContent
        job={job}
        onJobChange={(next) => {
          onJobChange(next);
          if (jdMetaErrors.jdCompanyName && next.jdCompanyName.trim()) {
            setJdMetaErrors((current) => ({
              ...current,
              jdCompanyName: undefined,
            }));
          }
          if (jdMetaErrors.jdJobRole && next.jdJobRole.trim()) {
            setJdMetaErrors((current) => ({
              ...current,
              jdJobRole: undefined,
            }));
          }
        }}
        jdMetaErrors={jdMetaErrors}
      />

      {running ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">
              {t("generate.job.runningVerdict.title")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("generate.job.runningVerdict.description")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

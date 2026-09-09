"use client";

import { useT } from "@/components/app/LocaleProvider";
import { GenerateVerdictPanelContent } from "@/components/generate/GenerateVerdictPanelContent";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateVerdictStepProps = {
  job: GenerateJobState;
  running: boolean;
  onRun: () => void;
};

export function GenerateVerdictStep({
  job,
  running,
  onRun,
}: GenerateVerdictStepProps) {
  const t = useT();

  useRegisterGenerateStepNav({
    onRun: running ? undefined : onRun,
    runBusy: running,
  });

  return (
    <>
      <GenerateVerdictPanelContent job={job} />

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

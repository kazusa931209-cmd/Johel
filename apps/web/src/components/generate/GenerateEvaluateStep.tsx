"use client";

import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import type { ResumeDownloadLabel } from "@/lib/api";

type GenerateEvaluateStepProps = {
  resume: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  evaluationMarkdown: string | null;
  evaluating: boolean;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateEvaluateStep({
  resume,
  downloadLabel,
  evaluationMarkdown,
  evaluating,
  onDownloaded,
}: GenerateEvaluateStepProps) {
  const t = useT();
  const { onDownload, downloading } = useResumeDownload(resume, downloadLabel, {
    onDownloaded,
  });

  useRegisterGenerateStepNav({
    onDownload: resume ? () => void onDownload() : undefined,
    downloadBusy: downloading,
  });

  if (!evaluationMarkdown) {
    return (
      <>
        <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
          {evaluating
            ? t("generate.evaluateStep.pending")
            : t("generate.evaluateStep.noEvaluation")}
        </div>

        {evaluating ? (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
              <p className="text-sm font-medium">
                {t("generate.evaluateStep.evaluating.title")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t("generate.evaluateStep.evaluating.description")}
              </p>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <AiVerdictMarkdown markdown={evaluationMarkdown} />
  );
}

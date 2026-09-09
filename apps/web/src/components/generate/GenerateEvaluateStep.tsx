"use client";

import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useStepMountAutoRun } from "@/components/generate/useStepMountAutoRun";
import { useResumeDocxDownload } from "@/components/generate/useResumeDocxDownload";

type GenerateEvaluateStepProps = {
  resume: GeneratedResume | null;
  runLabel?: string;
  evaluationMarkdown: string | null;
  evaluating: boolean;
  onAutoEvaluate: () => void | Promise<void>;
  onPrev: () => void;
};

export function GenerateEvaluateStep({
  resume,
  runLabel,
  evaluationMarkdown,
  evaluating,
  onAutoEvaluate,
  onPrev,
}: GenerateEvaluateStepProps) {
  const t = useT();
  const { onDownload, downloading } = useResumeDocxDownload(resume, runLabel);

  useStepMountAutoRun(onAutoEvaluate);

  useRegisterGenerateStepNav({
    onPrev,
    onDownload: resume ? () => void onDownload() : undefined,
    downloadBusy: downloading,
  });

  if (!evaluationMarkdown) {
    return (
      <div className="space-y-2">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          {t("generate.evaluateStep.title")}
        </h2>
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-center text-lg font-semibold tracking-tight">
        {t("generate.evaluateStep.title")}
      </h2>
      <div className="rounded-md border border-border bg-background px-4 py-4">
        <AiVerdictMarkdown markdown={evaluationMarkdown} />
      </div>
    </div>
  );
}

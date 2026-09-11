"use client";

import { useMemo } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import type { ResumeDownloadLabel } from "@/lib/api";

type GenerateGenerateStepProps = {
  resume: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  doEvaluate: boolean;
  generating: boolean;
  onRun: () => void;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateGenerateStep({
  resume,
  downloadLabel,
  doEvaluate,
  generating,
  onRun,
  onDownloaded,
}: GenerateGenerateStepProps) {
  const t = useT();
  const { onDownload, downloading } = useResumeDownload(resume, downloadLabel, {
    onDownloaded,
  });
  const markdown = useMemo(
    () => (resume ? resumeToMarkdown(resume) : ""),
    [resume],
  );

  useRegisterGenerateStepNav({
    onRun:
      generating || resume
        ? () => {
            if (!generating && resume && doEvaluate) {
              onRun();
            }
          }
        : undefined,
    onDownload: resume && !doEvaluate ? () => void onDownload() : undefined,
    runBusy: generating,
    downloadBusy: downloading,
  });

  if (!resume) {
    return (
      <>
        <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
          {generating
            ? t("generate.generateStep.pending")
            : t("generate.generateStep.noResume")}
        </div>

        {generating ? (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
              <p className="text-sm font-medium">
                {t("generate.generateStep.generating.title")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t("generate.generateStep.generating.description")}
              </p>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <ResumeMarkdown markdown={markdown} />
  );
}

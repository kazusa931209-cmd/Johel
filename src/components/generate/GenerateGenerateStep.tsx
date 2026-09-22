"use client";

import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { EditableResumePanel } from "@/components/generate/EditableResumePanel";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import type { ResumeDownloadLabel, ResumeLanguage } from "@/lib/api";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import type { ReactNode } from "react";

type GenerateGenerateStepProps = {
  resume: GeneratedResume | null;
  aiResumeSnapshot: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  resumeLanguage: ResumeLanguage;
  doEvaluate: boolean;
  generating: boolean;
  onRun: () => void;
  onResumeChange: (resume: GeneratedResume) => void;
  onHeaderRightChange?: (node: ReactNode | null) => void;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateGenerateStep({
  resume,
  aiResumeSnapshot,
  downloadLabel,
  resumeLanguage,
  doEvaluate,
  generating,
  onRun,
  onResumeChange,
  onHeaderRightChange,
  onDownloaded,
}: GenerateGenerateStepProps) {
  const t = useT();
  const { downloadAs, downloadAsZip, downloading, pdfDisabled } =
    useResumeDownload(resume, downloadLabel, {
      resumeLanguage,
      onDownloaded,
    });

  useRegisterGenerateStepNav({
    onRun:
      generating || resume
        ? () => {
            if (!generating && resume && doEvaluate) {
              onRun();
            }
          }
        : undefined,
    downloadMenu:
      resume && !doEvaluate
        ? {
            onDownloadDocx: () => void downloadAs("docx"),
            onDownloadPdf: () => void downloadAs("pdf"),
            onDownloadZip: () => void downloadAsZip(),
            pdfDisabled,
          }
        : undefined,
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
    <div className="flex min-h-0 flex-1 flex-col">
      <EditableResumePanel
        resume={resume}
        aiResumeSnapshot={aiResumeSnapshot}
        onResumeChange={onResumeChange}
        onHeaderRightChange={onHeaderRightChange}
      />
    </div>
  );
}

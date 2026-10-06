"use client";

import { type ReactNode } from "react";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { EditableResumePanel } from "@/components/generate/EditableResumePanel";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import { useT } from "@/components/app/LocaleProvider";
import type { ResumeDownloadLabel, ResumeLanguage } from "@/lib/api";
import type { GeneratedResume } from "@johel/resume";

type GenerateGenerateStepProps = {
  resume: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  resumeLanguage: ResumeLanguage;
  doEvaluate: boolean;
  generating: boolean;
  onRun: () => void;
  onResumeChange: (resume: GeneratedResume) => void;
  onResumePersist: () => void | Promise<void>;
  onHeaderRightChange?: (node: ReactNode | null) => void;
  onFooterChange?: (node: ReactNode | null) => void;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateGenerateStep({
  resume,
  downloadLabel,
  resumeLanguage,
  doEvaluate,
  generating,
  onRun,
  onResumeChange,
  onResumePersist,
  onHeaderRightChange,
  onFooterChange,
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
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        {generating
          ? t("generate.generateStep.pending")
          : t("generate.generateStep.noResume")}
      </div>
    );
  }

  return (
    <EditableResumePanel
      resume={resume}
      onResumeChange={onResumeChange}
      onResumePersist={onResumePersist}
      onHeaderRightChange={onHeaderRightChange}
      onFooterChange={onFooterChange}
    />
  );
}

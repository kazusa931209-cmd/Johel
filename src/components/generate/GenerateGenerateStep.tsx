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
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDraftCommitted: (resume: GeneratedResume) => void;
  onRun: () => void;
  onResumeChange: (resume: GeneratedResume) => void;
  onHeaderRightChange?: (node: ReactNode | null) => void;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateGenerateStep({
  resume,
  downloadLabel,
  resumeLanguage,
  doEvaluate,
  generating,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDraftCommitted,
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
      onDraftCommitted={onDraftCommitted}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={onUndo}
      onRedo={onRedo}
      onHeaderRightChange={onHeaderRightChange}
    />
  );
}

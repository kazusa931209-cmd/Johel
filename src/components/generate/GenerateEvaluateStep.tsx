"use client";

import type { GeneratedResume } from "@johel/resume";
import { useAiAssistant } from "@/components/app/AiAssistant";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { TextSelectionToolbar } from "@/components/shared/TextSelectionToolbar";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDownload } from "@/components/generate/useResumeDownload";
import type { ResumeDownloadLabel, ResumeLanguage } from "@/lib/api";

type GenerateEvaluateStepProps = {
  generationId: string | null;
  resume: GeneratedResume | null;
  downloadLabel?: ResumeDownloadLabel;
  resumeLanguage: ResumeLanguage;
  evaluationMarkdown: string | null;
  evaluating: boolean;
  onDownloaded?: () => void | Promise<void>;
};

export function GenerateEvaluateStep({
  generationId,
  resume,
  downloadLabel,
  resumeLanguage,
  evaluationMarkdown,
  evaluating,
  onDownloaded,
}: GenerateEvaluateStepProps) {
  const t = useT();
  const { openAiAssistant } = useAiAssistant();
  const { downloadAs, downloading, pdfDisabled } = useResumeDownload(
    resume,
    downloadLabel,
    {
      resumeLanguage,
      onDownloaded,
    },
  );

  useRegisterGenerateStepNav({
    downloadMenu: resume
      ? {
          onDownloadDocx: () => void downloadAs("docx"),
          onDownloadPdf: () => void downloadAs("pdf"),
          pdfDisabled,
        }
      : undefined,
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
    <TextSelectionToolbar
      onCheck={(selectedText) =>
        openAiAssistant({
          query: selectedText,
          category: "check-on-experiences",
          generationId,
        })
      }
    >
      <AiVerdictMarkdown markdown={evaluationMarkdown} />
    </TextSelectionToolbar>
  );
}

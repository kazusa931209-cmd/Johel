"use client";

import { useCallback, useMemo } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDocxDownload } from "@/components/generate/useResumeDocxDownload";

type GenerateGenerateStepProps = {
  resume: GeneratedResume | null;
  workflowName?: string;
  doEvaluate: boolean;
  evaluating: boolean;
  onPrev: () => void;
  onNext: () => void | Promise<void>;
};

export function GenerateGenerateStep({
  resume,
  workflowName,
  doEvaluate,
  evaluating,
  onPrev,
  onNext,
}: GenerateGenerateStepProps) {
  const { onDownload, downloading } = useResumeDocxDownload(resume, workflowName);
  const markdown = useMemo(
    () => (resume ? resumeToMarkdown(resume) : ""),
    [resume],
  );

  const handleNext = useCallback(() => {
    void onNext();
  }, [onNext]);

  useRegisterGenerateStepNav({
    onPrev,
    onNext: resume && doEvaluate ? handleNext : undefined,
    onDownload: resume && !doEvaluate ? () => void onDownload() : undefined,
    nextBusy: evaluating,
    downloadBusy: downloading,
  });

  if (!resume) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        No generated resume is available for this session. Go back to Workflow
        and run resume generation again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-center text-lg font-semibold tracking-tight">
        Generated Resume
      </h2>
      <div className="rounded-md border border-border bg-background px-4 py-4">
        <ResumeMarkdown markdown={markdown} />
      </div>

      {evaluating ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-lg border border-border bg-surface px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-medium">Evaluating Resume…</p>
            <p className="mt-1 text-xs text-muted">
              Please wait while the AI scores your resume against the job.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

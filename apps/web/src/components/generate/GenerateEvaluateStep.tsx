"use client";

import type { GeneratedResume } from "@johel/resume";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";
import { useResumeDocxDownload } from "@/components/generate/useResumeDocxDownload";

type GenerateEvaluateStepProps = {
  resume: GeneratedResume | null;
  workflowName?: string;
  evaluationMarkdown: string | null;
  onPrev: () => void;
};

export function GenerateEvaluateStep({
  resume,
  workflowName,
  evaluationMarkdown,
  onPrev,
}: GenerateEvaluateStepProps) {
  const { onDownload, downloading } = useResumeDocxDownload(resume, workflowName);

  useRegisterGenerateStepNav({
    onPrev,
    onDownload: resume ? () => void onDownload() : undefined,
    downloadBusy: downloading,
  });

  if (!evaluationMarkdown) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        No evaluation is available for this session. Go back to Generate and
        run evaluation again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-center text-lg font-semibold tracking-tight">
        Evaluation Result
      </h2>
      <div className="rounded-md border border-border bg-background px-4 py-4">
        <AiVerdictMarkdown markdown={evaluationMarkdown} />
      </div>
    </div>
  );
}

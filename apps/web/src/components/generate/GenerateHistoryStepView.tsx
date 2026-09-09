"use client";

import { useMemo } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import { GenerateCombineSummary } from "@/components/generate/GenerateCombineSummary";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import type { GenerateJobState } from "@/lib/generate-session";

type GenerateHistoryStepViewProps = {
  step: GenerateStep;
  job: GenerateJobState;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
  evaluationMarkdown: string | null;
};

export function GenerateHistoryStepView({
  step,
  job,
  combine,
  resume,
  evaluationMarkdown,
}: GenerateHistoryStepViewProps) {
  const t = useT();
  const resumeMarkdown = useMemo(
    () => (resume ? resumeToMarkdown(resume) : ""),
    [resume],
  );

  switch (step) {
    case "Job": {
      const rawJobText = job.jobText.trim();
      if (!rawJobText) {
        return (
          <p className="text-sm text-muted">{t("generate.previous.jobEmpty")}</p>
        );
      }
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
          {rawJobText}
        </pre>
      );
    }
    case "Verdict":
      return job.acceptedMarkdown ? (
        <div className="rounded-md border border-border bg-background px-3 py-3">
          <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
        </div>
      ) : (
        <p className="text-sm text-muted">{t("generate.previous.verdictEmpty")}</p>
      );
    case "Combine":
      return <GenerateCombineSummary combine={combine} />;
    case "Generate":
      return resume ? (
        <ResumeMarkdown markdown={resumeMarkdown} />
      ) : (
        <p className="text-sm text-muted">{t("generate.previous.resumeEmpty")}</p>
      );
    case "Evaluate":
      return evaluationMarkdown ? (
        <div className="rounded-md border border-border bg-background px-3 py-3">
          <AiVerdictMarkdown markdown={evaluationMarkdown} />
        </div>
      ) : (
        <p className="text-sm text-muted">
          {t("generate.evaluateStep.pending")}
        </p>
      );
    default:
      return null;
  }
}

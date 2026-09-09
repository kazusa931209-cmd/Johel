"use client";

import { useMemo } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import { GenerateCombineSummary } from "@/components/generate/GenerateCombineSummary";
import { GenerateJobDescriptionPreview } from "@/components/generate/GenerateJobDescriptionPreview";
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
    case "Job":
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("generate.steps.job")}
          </h2>
          <GenerateJobDescriptionPreview jobText={job.jobText} />
        </div>
      );
    case "Verdict":
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("generate.steps.verdict")}
          </h2>
          {job.acceptedMarkdown ? (
            <div className="rounded-md border border-border bg-background px-3 py-3">
              <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
            </div>
          ) : (
            <p className="text-sm text-muted">{t("generate.previous.verdictEmpty")}</p>
          )}
        </div>
      );
    case "Combine":
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("generate.steps.combine")}
          </h2>
          <GenerateCombineSummary combine={combine} />
        </div>
      );
    case "Generate":
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("generate.steps.generate")}
          </h2>
          {resume ? (
            <ResumeMarkdown markdown={resumeMarkdown} />
          ) : (
            <p className="text-sm text-muted">{t("generate.previous.resumeEmpty")}</p>
          )}
        </div>
      );
    case "Evaluate":
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("generate.steps.evaluate")}
          </h2>
          {evaluationMarkdown ? (
            <div className="rounded-md border border-border bg-background px-3 py-3">
              <AiVerdictMarkdown markdown={evaluationMarkdown} />
            </div>
          ) : (
            <p className="text-sm text-muted">
              {t("generate.evaluateStep.pending")}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}

"use client";

import { useMemo, type ReactNode } from "react";
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
import { getAdjacentGenerateStep } from "@/lib/generate-steps";

type GeneratePreviousStepPanelProps = {
  currentStep: GenerateStep;
  visibleSteps: readonly GenerateStep[];
  job: GenerateJobState;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
};

const PREVIOUS_STEP_TITLE_KEYS: Record<GenerateStep, string> = {
  Job: "generate.previous.jobTitle",
  Verdict: "generate.previous.verdictTitle",
  Combine: "generate.previous.combineTitle",
  Generate: "generate.previous.resumeTitle",
  Evaluate: "generate.previous.evaluationTitle",
};

export function useGeneratePreviousStepPanel({
  currentStep,
  visibleSteps,
  job,
  combine,
  resume,
}: GeneratePreviousStepPanelProps): {
  previousTitle?: string;
  previousContent: ReactNode | null;
} {
  const t = useT();

  const previousStep = useMemo(
    () => getAdjacentGenerateStep(visibleSteps, currentStep, "prev"),
    [currentStep, visibleSteps],
  );

  const previousTitle =
    currentStep === "Job"
      ? t("generate.job.filteredPreviewTitle")
      : previousStep
        ? t(PREVIOUS_STEP_TITLE_KEYS[previousStep])
        : undefined;

  const previousContent = useMemo(() => {
    if (currentStep === "Job") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {t("generate.job.filteredPreviewHint")}
          </p>
          <GenerateJobDescriptionPreview jobText={job.jobText} />
        </div>
      );
    }

    if (!previousStep) {
      return null;
    }

    switch (previousStep) {
      case "Job":
        return <GenerateJobDescriptionPreview jobText={job.jobText} />;
      case "Verdict":
        return job.acceptedMarkdown ? (
          <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
        ) : (
          <p className="text-sm text-muted">{t("generate.previous.verdictEmpty")}</p>
        );
      case "Combine":
        return (
          <GenerateCombineSummary combine={combine} />
        );
      case "Generate":
        return resume ? (
          <ResumeMarkdown markdown={resumeToMarkdown(resume)} />
        ) : (
          <p className="text-sm text-muted">{t("generate.previous.resumeEmpty")}</p>
        );
      default:
        return null;
    }
  }, [combine, currentStep, job.acceptedMarkdown, job.jobText, previousStep, resume, t]);

  return { previousTitle, previousContent };
}

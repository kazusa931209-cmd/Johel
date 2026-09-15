"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import { GenerateCombineSummary } from "@/components/generate/GenerateCombineSummary";
import { GenerateJdMetaFields } from "@/components/generate/GenerateJdMetaFields";
import { GenerateJobDescriptionPreview } from "@/components/generate/GenerateJobDescriptionPreview";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import { formatThousandsSeparated } from "@/lib/helper";
import type { GenerateJobState } from "@/lib/generate-session";
import { noiseFilter } from "@/lib/jobNoiseFilter";
import { getAdjacentGenerateStep } from "@/lib/generate-steps";

type GeneratePreviousStepPanelProps = {
  currentStep: GenerateStep;
  visibleSteps: readonly GenerateStep[];
  doVerdict: boolean;
  job: GenerateJobState;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
};

type GenerateReferenceView = "Combine" | "Verdict";

const PREVIOUS_STEP_TITLE_KEYS: Record<GenerateStep, string> = {
  Job: "generate.previous.jobTitle",
  Verdict: "generate.previous.verdictTitle",
  Combine: "generate.previous.combineTitle",
  Generate: "generate.previous.resumeTitle",
  Evaluate: "generate.previous.evaluationTitle",
};

const REFERENCE_TAB_LABEL_KEYS: Record<GenerateReferenceView, string> = {
  Combine: "generate.steps.combine",
  Verdict: "generate.steps.verdict",
};

function GenerateReferenceTabs({
  active,
  onChange,
}: {
  active: GenerateReferenceView;
  onChange: (view: GenerateReferenceView) => void;
}) {
  const t = useT();
  const tabs: GenerateReferenceView[] = ["Combine", "Verdict"];

  return (
    <div
      className="flex gap-1"
      role="tablist"
      aria-label={t("generate.generateStep.referenceTabsAria")}
    >
      {tabs.map((tab) => {
        const selected = active === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`generate-reference-tab-${tab}`}
            aria-selected={selected}
            aria-controls="generate-reference-tabpanel"
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            ].join(" ")}
            onClick={() => onChange(tab)}
          >
            {t(REFERENCE_TAB_LABEL_KEYS[tab])}
          </button>
        );
      })}
    </div>
  );
}

function VerdictReferenceContent({ job }: { job: GenerateJobState }) {
  const t = useT();

  return (
    <div className="space-y-4">
      <GenerateJdMetaFields
        jdCompanyName={job.jdCompanyName}
        jdJobRole={job.jdJobRole}
        onChange={() => {}}
        readOnly
      />
      {job.acceptedMarkdown ? (
        <AiVerdictMarkdown markdown={job.acceptedMarkdown} />
      ) : (
        <p className="text-sm text-muted">{t("generate.previous.verdictEmpty")}</p>
      )}
    </div>
  );
}

export function useGeneratePreviousStepPanel({
  currentStep,
  visibleSteps,
  doVerdict,
  job,
  combine,
  resume,
}: GeneratePreviousStepPanelProps): {
  previousTitle?: ReactNode;
  previousContent: ReactNode | null;
  previousHeaderRight?: ReactNode;
} {
  const t = useT();
  const [referenceView, setReferenceView] =
    useState<GenerateReferenceView>("Combine");

  useEffect(() => {
    if (currentStep !== "Generate") {
      setReferenceView("Combine");
    }
  }, [currentStep]);

  const previousStep = useMemo(
    () => getAdjacentGenerateStep(visibleSteps, currentStep, "prev"),
    [currentStep, visibleSteps],
  );

  const filteredJobText = useMemo(
    () => noiseFilter(job.jobText.trim()).text,
    [job.jobText],
  );
  const filteredCharCount = formatThousandsSeparated(filteredJobText.length);

  const isFilteredJobPanel =
    currentStep === "Job" || previousStep === "Job";

  const showGenerateReferenceTabs =
    currentStep === "Generate" && doVerdict;

  const previousTitle = isFilteredJobPanel
    ? t("generate.job.filteredPreviewTitle")
    : showGenerateReferenceTabs
      ? (
          <GenerateReferenceTabs
            active={referenceView}
            onChange={setReferenceView}
          />
        )
      : previousStep
        ? t(PREVIOUS_STEP_TITLE_KEYS[previousStep])
        : undefined;

  const previousHeaderRight = isFilteredJobPanel ? (
    <span className="text-xs tabular-nums text-muted">
      {t("generate.job.filteredCharCountLabel", { count: filteredCharCount })}
    </span>
  ) : undefined;

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

    if (currentStep === "Generate") {
      if (doVerdict && referenceView === "Verdict") {
        return (
          <div
            id="generate-reference-tabpanel"
            role="tabpanel"
            aria-labelledby={`generate-reference-tab-${referenceView}`}
          >
            <VerdictReferenceContent job={job} />
          </div>
        );
      }

      return (
        <div
          id={showGenerateReferenceTabs ? "generate-reference-tabpanel" : undefined}
          role={showGenerateReferenceTabs ? "tabpanel" : undefined}
          aria-labelledby={
            showGenerateReferenceTabs
              ? `generate-reference-tab-${referenceView}`
              : undefined
          }
        >
          <GenerateCombineSummary combine={combine} />
        </div>
      );
    }

    if (!previousStep) {
      return null;
    }

    switch (previousStep) {
      case "Job":
        return (
          <GenerateJobDescriptionPreview jobText={job.jobText} />
        );
      case "Verdict":
        return <VerdictReferenceContent job={job} />;
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
  }, [
    combine,
    currentStep,
    doVerdict,
    job,
    previousStep,
    referenceView,
    resume,
    showGenerateReferenceTabs,
    t,
  ]);

  return {
    previousTitle,
    previousContent,
    previousHeaderRight,
  };
}

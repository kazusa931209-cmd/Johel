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
  refinePanel?: ReactNode | null;
  refineFooterApply?: ReactNode | null;
  /** Resume Builder Evaluate: left panel is resume-only (no reference tabs). */
  evaluateResumeOnly?: boolean;
};

type GenerateReferenceView = "Verdict" | "Combine" | "Resume" | "Refine";

const PREVIOUS_STEP_TITLE_KEYS: Record<GenerateStep, string> = {
  Job: "generate.previous.jobTitle",
  Verdict: "generate.previous.verdictTitle",
  Combine: "generate.previous.combineTitle",
  Generate: "generate.previous.resumeTitle",
  Evaluate: "generate.previous.evaluationTitle",
};

const REFERENCE_TAB_LABEL_KEYS: Record<GenerateReferenceView, string> = {
  Verdict: "generate.steps.verdict",
  Combine: "generate.steps.combine",
  Resume: "generate.previous.resumeTitle",
  Refine: "generate.generateStep.refine.tab",
};

function GenerateReferenceTabs({
  tabs,
  active,
  ariaLabel,
  onChange,
}: {
  tabs: GenerateReferenceView[];
  active: GenerateReferenceView;
  ariaLabel: string;
  onChange: (view: GenerateReferenceView) => void;
}) {
  const t = useT();

  return (
    <div className="flex gap-1" role="tablist" aria-label={ariaLabel}>
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

function ResumeReferenceContent({ resume }: { resume: GeneratedResume | null }) {
  const t = useT();

  return resume ? (
    <ResumeMarkdown markdown={resumeToMarkdown(resume)} />
  ) : (
    <p className="text-sm text-muted">{t("generate.previous.resumeEmpty")}</p>
  );
}

function ReferenceTabPanel({
  active,
  children,
}: {
  active: GenerateReferenceView;
  children: ReactNode;
}) {
  return (
    <div
      id="generate-reference-tabpanel"
      role="tabpanel"
      aria-labelledby={`generate-reference-tab-${active}`}
    >
      {children}
    </div>
  );
}

function renderReferenceViewContent(
  view: GenerateReferenceView,
  job: GenerateJobState,
  combine: CombineSnapshot,
  resume: GeneratedResume | null,
  refinePanel: ReactNode | null | undefined,
): ReactNode {
  switch (view) {
    case "Verdict":
      return <VerdictReferenceContent job={job} />;
    case "Combine":
      return <GenerateCombineSummary combine={combine} />;
    case "Resume":
      return <ResumeReferenceContent resume={resume} />;
    case "Refine":
      return refinePanel ?? null;
  }
}

export function useGeneratePreviousStepPanel({
  currentStep,
  visibleSteps,
  doVerdict,
  job,
  combine,
  resume,
  refinePanel,
  refineFooterApply,
  evaluateResumeOnly = false,
}: GeneratePreviousStepPanelProps): {
  previousTitle?: ReactNode;
  previousContent: ReactNode | null;
  previousHeaderRight?: ReactNode;
  previousFooter?: ReactNode;
} {
  const t = useT();
  const [referenceView, setReferenceView] =
    useState<GenerateReferenceView>("Refine");

  useEffect(() => {
    if (currentStep === "Generate") {
      setReferenceView("Refine");
      return;
    }
    if (currentStep === "Evaluate") {
      setReferenceView("Resume");
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

  const generateReferenceTabs = useMemo(() => {
    if (currentStep !== "Generate") {
      return null;
    }
    if (doVerdict) {
      return ["Verdict", "Combine", "Refine"] as const;
    }
    return ["Combine", "Refine"] as const;
  }, [currentStep, doVerdict]);

  const evaluateReferenceTabs = useMemo(() => {
    if (currentStep !== "Evaluate" || evaluateResumeOnly) {
      return null;
    }
    const tabs: GenerateReferenceView[] = [];
    if (doVerdict) {
      tabs.push("Verdict");
    }
    tabs.push("Combine", "Resume");
    return tabs;
  }, [currentStep, doVerdict, evaluateResumeOnly]);

  const activeReferenceTabs =
    generateReferenceTabs ?? evaluateReferenceTabs ?? null;

  const previousTitle = isFilteredJobPanel
    ? t("generate.job.filteredPreviewTitle")
    : activeReferenceTabs
      ? (
          <GenerateReferenceTabs
            tabs={[...activeReferenceTabs]}
            active={referenceView}
            ariaLabel={
              currentStep === "Evaluate"
                ? t("generate.evaluateStep.referenceTabsAria")
                : t("generate.generateStep.referenceTabsAria")
            }
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

  const previousFooter =
    currentStep === "Generate" &&
    referenceView === "Refine" &&
    refineFooterApply
      ? refineFooterApply
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

    if (activeReferenceTabs) {
      return (
        <ReferenceTabPanel active={referenceView}>
          {renderReferenceViewContent(
            referenceView,
            job,
            combine,
            resume,
            refinePanel,
          )}
        </ReferenceTabPanel>
      );
    }

    if (currentStep === "Generate") {
      return <GenerateCombineSummary combine={combine} />;
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
        return <ResumeReferenceContent resume={resume} />;
      default:
        return null;
    }
  }, [
    activeReferenceTabs,
    combine,
    currentStep,
    job,
    previousStep,
    referenceView,
    refinePanel,
    resume,
    t,
  ]);

  return {
    previousTitle,
    previousContent,
    previousHeaderRight,
    previousFooter,
  };
}

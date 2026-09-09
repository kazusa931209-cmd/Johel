"use client";

import { Fragment } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GENERATE_STEP_LABEL_KEYS } from "@/lib/generate-step-labels";
import {
  getHistoryVisibleSteps,
  isProcessedThroughStep,
} from "@/lib/generation-step-progress";

type HistoryStepsCellProps = {
  processedStep: string;
  doVerdict: boolean;
  doEvaluate: boolean;
  finalized: boolean;
};

export function HistoryStepsCell({
  processedStep,
  doVerdict,
  doEvaluate,
  finalized,
}: HistoryStepsCellProps) {
  const t = useT();
  const steps = getHistoryVisibleSteps(doEvaluate, doVerdict);
  const downloadLabel = t("generate.nav.download");

  return (
    <ol
      className="flex min-w-48 flex-wrap items-center gap-1"
      aria-label={t("history.list.stepsAria")}
    >
      {steps.map((step) => (
        <Fragment key={step}>
          <li>
            <HistoryStepPill
              label={t(GENERATE_STEP_LABEL_KEYS[step])}
              finished={isProcessedThroughStep(step, processedStep)}
            />
          </li>
          <li className="text-xs text-border" aria-hidden>
            /
          </li>
        </Fragment>
      ))}
      <li>
        <HistoryStepPill
          label={downloadLabel}
          finished={finalized}
        />
      </li>
    </ol>
  );
}

function HistoryStepPill({
  label,
  finished,
}: {
  label: string;
  finished: boolean;
}) {
  return (
    <span
      title={label}
      className={
        finished
          ? "inline-flex rounded-full border border-foreground px-2 py-0.5 text-xs font-medium"
          : "inline-flex rounded-full border border-border px-2 py-0.5 text-xs text-muted"
      }
    >
      {label}
    </span>
  );
}

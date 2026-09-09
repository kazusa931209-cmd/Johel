"use client";

import Link from "next/link";
import { useT } from "@/components/app/LocaleProvider";
import { useGenerateStatus } from "@/components/app/GenerateStatusProvider";
import { HistoryStepsCell } from "@/components/generate/HistoryStepsCell";
import {
  GENERATE_STEP_LABEL_KEYS,
  isGenerateStep,
} from "@/lib/generate-step-labels";

export function StudioHeaderStatus() {
  const t = useT();
  const { status } = useGenerateStatus();

  if (!status.generationPublicId) {
    return (
      <p className="truncate text-sm text-muted">{t("nav.header.statusIdle")}</p>
    );
  }

  const processedStepLabel =
    status.processedStep != null && isGenerateStep(status.processedStep)
      ? t(GENERATE_STEP_LABEL_KEYS[status.processedStep])
      : t("nav.header.statusStepUnknown");

  return (
    <div
      className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-4"
      title={t("nav.header.statusTitle", {
        id: status.generationPublicId,
        step: processedStepLabel,
      })}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 pt-0.5 text-sm text-muted">
          {t("nav.header.statusCurrent")}: 
        </span>
        <Link
          href="/"
          className="shrink-0 truncate font-mono text-sm text-foreground hover:underline pt-0.5"
        >
          {status.generationPublicId}
        </Link>
      </div>
      {status.processedStep != null ? (
        <HistoryStepsCell
          processedStep={status.processedStep}
          doVerdict={status.doVerdict}
          doEvaluate={status.doEvaluate}
          finalized={status.finalized}
        />
      ) : null}
    </div>
  );
}

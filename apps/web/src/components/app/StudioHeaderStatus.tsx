"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useGenerateStatus } from "@/components/app/GenerateStatusProvider";
import { HistoryStepsCell } from "@/components/generate/HistoryStepsCell";
import { getAiUsageSummary } from "@/lib/api";
import {
  GENERATE_STEP_LABEL_KEYS,
  isGenerateStep,
} from "@/lib/generate-step-labels";
import { formatTokenUsed } from "@/lib/tokens";

export function StudioHeaderStatus() {
  const t = useT();
  const { status } = useGenerateStatus();
  const { tokenUsed: accountTokenUsed } = useAiUsage();
  const [generationTokenUsed, setGenerationTokenUsed] = useState(0);

  useEffect(() => {
    if (!status.generationId) {
      setGenerationTokenUsed(0);
      return;
    }

    let cancelled = false;
    void getAiUsageSummary(status.generationId).then((res) => {
      if (cancelled) return;
      setGenerationTokenUsed(res.data?.tokenUsed ?? 0);
    });

    return () => {
      cancelled = true;
    };
  }, [accountTokenUsed, status.generationId]);

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
      className="flex max-w-full min-w-0 flex-wrap items-center justify-start gap-4"
      title={t("nav.header.statusTitle", {
        id: status.generationPublicId,
        step: processedStepLabel,
      })}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 pt-1 text-sm text-muted">
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
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span
            className="shrink-0 pt-1 text-sm text-muted"
            title={t("nav.header.generationTokenUsedTitle")}
          >
            {t("nav.header.generationTokenUsed", {
              count: formatTokenUsed(generationTokenUsed),
            })}
          </span>
          <HistoryStepsCell
            processedStep={status.processedStep}
            doVerdict={status.doVerdict}
            doEvaluate={status.doEvaluate}
            finalized={status.finalized}
          />
        </div>
      ) : null}
    </div>
  );
}

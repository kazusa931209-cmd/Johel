"use client";

import Link from "next/link";
import { useT } from "@/components/app/LocaleProvider";
import { useGenerateStatus } from "@/components/app/GenerateStatusProvider";
import { GENERATE_STEP_LABEL_KEYS } from "@/lib/generate-step-labels";

export function StudioHeaderStatus() {
  const t = useT();
  const { status } = useGenerateStatus();

  if (!status.generationPublicId) {
    return (
      <p className="truncate text-sm text-muted">{t("nav.header.statusIdle")}</p>
    );
  }

  const stepLabel =
    status.activeStep != null
      ? t(GENERATE_STEP_LABEL_KEYS[status.activeStep])
      : null;

  const historyStatusLabel =
    status.historyStatus === "completed"
      ? t("history.status.completed")
      : status.historyStatus === "in_progress"
        ? t("history.status.inProgress")
        : null;

  const historyHref = `/history/${status.generationPublicId}`;

  return (
    <div
      className="flex max-w-full min-w-0 items-center justify-center gap-2 text-sm"
      title={t("nav.header.statusTitle", {
        id: status.generationPublicId,
        step: stepLabel ?? t("nav.header.statusStepUnknown"),
      })}
    >
      <Link
        href={historyHref}
        className="truncate font-mono text-foreground hover:underline"
      >
        {status.generationPublicId}
      </Link>
      {stepLabel ? (
        <>
          <span className="shrink-0 text-muted" aria-hidden>
            ·
          </span>
          <span className="shrink-0 text-muted">{stepLabel}</span>
        </>
      ) : null}
      {historyStatusLabel ? (
        <>
          <span className="shrink-0 text-muted" aria-hidden>
            ·
          </span>
          <span className="shrink-0 text-muted">{historyStatusLabel}</span>
        </>
      ) : null}
    </div>
  );
}

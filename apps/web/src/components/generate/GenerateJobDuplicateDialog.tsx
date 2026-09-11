"use client";

import type { ReactNode } from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { useT } from "@/components/app/LocaleProvider";
import type { JobDuplicateMatch } from "@/lib/api";

type GenerateJobDuplicateDialogProps = {
  open: boolean;
  newFilteredJobText: string;
  match: JobDuplicateMatch;
  busy?: boolean;
  onClose: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onSwitch?: () => void;
};

function JobPanel({
  title,
  meta,
  text,
}: {
  title: string;
  meta?: ReactNode;
  text: string;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {meta ? (
          <p className="text-xs text-muted">{meta}</p>
        ) : null}
      </div>
      <pre className="max-h-60 min-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground">
        {text}
      </pre>
    </div>
  );
}

export function GenerateJobDuplicateDialog({
  open,
  newFilteredJobText,
  match,
  busy = false,
  onClose,
  onCancel,
  onContinue,
  onSwitch,
}: GenerateJobDuplicateDialogProps) {
  const t = useT();

  if (!open) {
    return null;
  }

  const isFinalized = match.finalized;
  const title = isFinalized
    ? t("generate.jobDuplicate.finalized.title")
    : t("generate.jobDuplicate.unfinished.title");
  const body = isFinalized
    ? t("generate.jobDuplicate.finalized.body")
    : t("generate.jobDuplicate.unfinished.body");
  const matchedMeta = isFinalized ? (
    <>
      {t("generate.jobDuplicate.matchedMetaFinalizedPrefix")}{" "}
      <span className="font-mono">{match.publicId}</span>
      {t("generate.jobDuplicate.matchedMetaFinalizedSuffix")}
    </>
  ) : (
    <>
      {t("generate.jobDuplicate.matchedMetaUnfinishedPrefix")}{" "}
      <span className="font-mono">{match.publicId}</span>
      {t("generate.jobDuplicate.matchedMetaUnfinishedSuffix")}
    </>
  );

  return (
    <DetailDialog
      mode="form"
      title={title}
      closeDisabled={busy}
      onClose={onClose}
      panelClassName="max-w-6xl"
      contentClassName="space-y-4"
    >
      <p className="text-sm text-muted">{body}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <JobPanel
          title={t("generate.jobDuplicate.newJd")}
          meta={t("generate.jobDuplicate.newJdMeta")}
          text={newFilteredJobText}
        />
        <JobPanel
          title={t("generate.jobDuplicate.matchedJd")}
          meta={matchedMeta}
          text={match.filteredJobText}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {t("generate.jobDuplicate.cancel")}
        </button>
        {!isFinalized && onSwitch ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSwitch}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {t("generate.jobDuplicate.switchToExisting")}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onContinue}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
        >
          {isFinalized
            ? t("generate.jobDuplicate.continue")
            : t("generate.jobDuplicate.continueWithNew")}
        </button>
      </div>
    </DetailDialog>
  );
}

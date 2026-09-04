"use client";

import ReactMarkdown from "react-markdown";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { formatThousandsSeparated } from "@/lib/helper";
import type { AiFilterUsage } from "@/lib/api";

type AiFilterResultDialogProps = {
  markdown: string;
  usage: AiFilterUsage;
  onClose: () => void;
  onDiscard: () => void;
  onRetry: () => void;
  onNext: () => void;
};

export function AiFilterResultDialog({
  markdown,
  usage,
  onClose,
  onDiscard,
  onRetry,
  onNext,
}: AiFilterResultDialogProps) {
  return (
    <DetailDialog
      title="AI Filter result"
      onClose={onClose}
      dismissOnBackdrop={false}
    >
      <p className="text-xs text-muted">
        Tokens this run:{" "}
        {formatThousandsSeparated(usage.inputTokenUsage + usage.outputTokenUsage)}{" "}
        (in {formatThousandsSeparated(usage.inputTokenUsage)} / out{" "}
        {formatThousandsSeparated(usage.outputTokenUsage)})
      </p>

      <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border bg-background px-3 py-3">
        <div className="prose prose-sm max-w-none dark:prose-invert [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:my-2">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-md border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/10"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-foreground px-3 py-2 text-sm text-background hover:opacity-90"
        >
          Next
        </button>
      </div>
    </DetailDialog>
  );
}

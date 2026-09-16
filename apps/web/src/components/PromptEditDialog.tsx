"use client";

import { useState } from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { formatThousandsSeparated } from "@/lib/helper";

const PROMPT_MAX = 10_000;

type PromptEditDialogProps = {
  title: string;
  value: string;
  defaultValue: string;
  rows: number;
  placeholder: string;
  impactNotice: string;
  resetLabel: string;
  applyLabel: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export function PromptEditDialog({
  title,
  value,
  defaultValue,
  rows,
  placeholder,
  impactNotice,
  resetLabel,
  applyLabel,
  onClose,
  onApply,
}: PromptEditDialogProps) {
  const [draft, setDraft] = useState(value);
  const length = draft.length;
  const overLimit = length > PROMPT_MAX;

  function apply() {
    onApply(draft);
    onClose();
  }

  function resetDraft() {
    setDraft(defaultValue);
  }

  return (
    <DetailDialog
      mode="form"
      title={title}
      onClose={onClose}
      panelClassName="max-w-[96rem]"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          apply();
        }
      }}
    >
      <label className="block space-y-1 text-sm">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-describedby="prompt-edit-length"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
        <p
          id="prompt-edit-length"
          className={[
            "text-xs tabular-nums",
            overLimit ? "text-danger" : "text-muted",
          ].join(" ")}
        >
          {formatThousandsSeparated(length)} /{" "}
          {formatThousandsSeparated(PROMPT_MAX)} characters
        </p>
      </label>
      <div className="flex items-center justify-between gap-4">
        <div
          role="alert"
          className="min-w-0 flex-1 rounded-md border border-border bg-toast-warning-bg px-3 py-2 text-left text-sm text-toast-warning-fg"
        >
          {impactNotice}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground hover:opacity-90"
          >
            {resetLabel}
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </DetailDialog>
  );
}

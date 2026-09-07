"use client";

import { useState } from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";

type PromptEditDialogProps = {
  title: string;
  value: string;
  rows: number;
  placeholder: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export function PromptEditDialog({
  title,
  value,
  rows,
  placeholder,
  onClose,
  onApply,
}: PromptEditDialogProps) {
  const [draft, setDraft] = useState(value);

  function apply() {
    onApply(draft);
    onClose();
  }

  return (
    <DetailDialog
      mode="form"
      title={title}
      onClose={onClose}
      panelClassName="max-w-3xl"
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
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
      </label>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </DetailDialog>
  );
}

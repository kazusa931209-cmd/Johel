"use client";

import { ReactNode } from "react";
import { CloseButton } from "@/components/shared/action-icon-buttons";

type DetailDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function DetailDialog({ title, onClose, children }: DetailDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="space-y-3 text-sm">{children}</div>
      </div>
    </div>
  );
}

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </div>
      <div className="whitespace-pre-wrap break-words text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </div>
    </div>
  );
}

export const TABLE_ROW_HOVER_CLASS =
  "cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover";

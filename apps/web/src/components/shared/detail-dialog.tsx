"use client";

import { KeyboardEventHandler, ReactNode } from "react";
import { CloseButton } from "@/components/shared/action-icon-buttons";

type DetailDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
  closeDisabled?: boolean;
  dismissOnBackdrop?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  panelClassName?: string;
};

export function DetailDialog({
  title,
  onClose,
  children,
  role = "dialog",
  closeDisabled = false,
  dismissOnBackdrop = true,
  onKeyDown,
  panelClassName,
}: DetailDialogProps) {
  function requestClose() {
    if (closeDisabled) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="presentation"
      onClick={dismissOnBackdrop ? requestClose : undefined}
    >
      <div
        role={role}
        aria-modal="true"
        aria-label={title}
        className={[
          "max-h-[85vh] w-full overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg",
          panelClassName ?? "max-w-lg",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <CloseButton onClick={requestClose} disabled={closeDisabled} />
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

"use client";

import { KeyboardEventHandler, ReactNode } from "react";
import { CloseButton } from "@/components/shared/action-icon-buttons";

export type DetailDialogMode = "view" | "form";

type DetailDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
  mode?: DetailDialogMode;
  closeDisabled?: boolean;
  dismissOnBackdrop?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  panelClassName?: string;
  contentClassName?: string;
};

function resolveDismissOnBackdrop(
  mode: DetailDialogMode,
  dismissOnBackdrop?: boolean,
): boolean {
  if (dismissOnBackdrop !== undefined) {
    return dismissOnBackdrop;
  }
  return mode === "view";
}

export function DetailDialog({
  title,
  onClose,
  children,
  role = "dialog",
  mode = "view",
  closeDisabled = false,
  dismissOnBackdrop,
  onKeyDown,
  panelClassName,
  contentClassName,
}: DetailDialogProps) {
  const canDismissOnBackdrop = resolveDismissOnBackdrop(mode, dismissOnBackdrop);

  function requestClose() {
    if (closeDisabled) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="presentation"
      onClick={canDismissOnBackdrop ? requestClose : undefined}
    >
      <div
        role={role}
        aria-modal="true"
        aria-label={title}
        className={[
          "max-h-[85vh] w-full overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg",
          panelClassName ?? "max-w-5xl",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <CloseButton onClick={requestClose} disabled={closeDisabled} />
        </div>
        <div className={contentClassName ?? "space-y-3 text-sm"}>{children}</div>
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
      <div className="whitespace-pre-wrap wrap-break-words text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </div>
    </div>
  );
}

export const TABLE_ROW_HOVER_CLASS =
  "cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover";

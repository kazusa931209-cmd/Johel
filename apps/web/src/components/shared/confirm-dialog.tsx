"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";

/** Half the default DetailDialog width (`max-w-5xl` → `max-w-lg`). */
const CONFIRM_DIALOG_PANEL_CLASS = "max-w-lg";

type ConfirmDialogProps = {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: ReactNode;
  children: ReactNode;
  confirmDisabled?: boolean;
  closeDisabled?: boolean;
  variant?: "default" | "danger";
};

export function ConfirmDialog({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  children,
  confirmDisabled = false,
  closeDisabled = false,
  variant = "default",
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (closeDisabled) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [closeDisabled, onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (confirmDisabled) return;
    onConfirm();
  }

  const confirmButtonClass =
    variant === "danger"
      ? "rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg disabled:opacity-60"
      : "rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60";

  return (
    <DetailDialog
      title={title}
      role="alertdialog"
      onClose={onClose}
      closeDisabled={closeDisabled}
      panelClassName={CONFIRM_DIALOG_PANEL_CLASS}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {children}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={confirmDisabled}
            className={confirmButtonClass}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </DetailDialog>
  );
}

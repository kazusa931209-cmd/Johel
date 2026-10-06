"use client";

import {
  useEffect,
  useRef,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { DetailDialog } from "@/components/shared/detail-dialog";

/** Half the default DetailDialog width (`max-w-5xl` → `max-w-lg`). */
const CONFIRM_DIALOG_PANEL_CLASS = "max-w-lg";

type ConfirmDialogProps = {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: ReactNode;
  /** When set, shows a secondary button that calls `onClose` (e.g. No / Cancel). */
  cancelLabel?: ReactNode;
  children: ReactNode;
  confirmDisabled?: boolean;
  closeDisabled?: boolean;
  variant?: "default" | "danger";
};

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function ConfirmDialog({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  children,
  confirmDisabled = false,
  closeDisabled = false,
  variant = "default",
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function swallowDialogKeys(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== "Escape") {
        return;
      }

      if (event.key === "Escape") {
        if (closeDisabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (!confirmDisabled) {
        onConfirm();
      }
    }

    document.addEventListener("keydown", swallowDialogKeys, true);
    return () => document.removeEventListener("keydown", swallowDialogKeys, true);
  }, [closeDisabled, confirmDisabled, onClose, onConfirm]);

  const handlePanelKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.stopPropagation();
    }
  };

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
      onKeyDown={handlePanelKeyDown}
    >
      <div className="space-y-3">
        {children}
        <div className="flex justify-end gap-2">
          {cancelLabel ? (
            <button
              type="button"
              disabled={closeDisabled}
              onClick={() => {
                if (closeDisabled) return;
                onClose();
              }}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmButtonRef}
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              if (confirmDisabled) return;
              onConfirm();
            }}
            className={confirmButtonClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </DetailDialog>
  );
}

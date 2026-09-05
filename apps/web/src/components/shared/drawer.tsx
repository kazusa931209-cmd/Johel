"use client";

import { useEffect, type ReactNode } from "react";
import { CloseButton } from "@/components/shared/action-icon-buttons";

type DrawerProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  zIndex?: number;
  closeOnEscape?: boolean;
};

export function Drawer({
  title,
  open,
  onClose,
  children,
  widthClass = "w-[min(64rem,92vw)]",
  zIndex = 50,
  closeOnEscape = true,
}: DrawerProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0" style={{ zIndex }} role="presentation">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 right-0 flex h-full flex-col border-l border-border bg-surface shadow-xl ${widthClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        {children}
      </aside>
    </div>
  );
}

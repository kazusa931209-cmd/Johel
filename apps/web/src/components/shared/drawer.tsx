"use client";

import { useEffect, useState, type ReactNode } from "react";
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

/** Keep in sync with `--drawer-duration` in `globals.css`. */
export const DRAWER_TRANSITION_MS = 420;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Drawer({
  title,
  open,
  onClose,
  children,
  widthClass = "w-[min(64rem,92vw)]",
  zIndex = 50,
  closeOnEscape = true,
}: DrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (open) {
      let innerFrame = 0;
      const outerFrame = window.requestAnimationFrame(() => {
        innerFrame = window.requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        window.cancelAnimationFrame(outerFrame);
        if (innerFrame) {
          window.cancelAnimationFrame(innerFrame);
        }
      };
    }

    setEntered(false);
    const delay = prefersReducedMotion() ? 0 : DRAWER_TRANSITION_MS;
    const timeout = window.setTimeout(() => setMounted(false), delay);
    return () => window.clearTimeout(timeout);
  }, [open, mounted]);

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

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0" style={{ zIndex }} role="presentation">
      <div
        className={`drawer-backdrop absolute inset-0 bg-black/50${entered ? " drawer-open" : ""}`}
        aria-hidden
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-panel absolute top-0 right-0 flex h-full flex-col border-l border-border bg-surface shadow-xl ${widthClass}${entered ? " drawer-open" : ""}`}
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

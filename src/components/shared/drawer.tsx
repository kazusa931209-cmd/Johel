"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDrawerPosition } from "@/components/app/DrawerPositionProvider";
import { CloseButton } from "@/components/shared/action-icon-buttons";

type DrawerProps = {
  title: ReactNode;
  /** Accessible name when `title` is not plain text. */
  titleAriaLabel?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Primary actions (Save, Suggest, Apply, pagination, etc.) pinned below scrollable body. */
  footer?: ReactNode;
  /** Controls in the header row, immediately left of the close button. */
  headerTrailing?: ReactNode;
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
  titleAriaLabel,
  open,
  onClose,
  children,
  footer,
  headerTrailing,
  widthClass = "w-[min(64rem,92vw)]",
  zIndex = 50,
  closeOnEscape = true,
}: DrawerProps) {
  const accessibleTitle =
    titleAriaLabel ?? (typeof title === "string" ? title : undefined);
  const { drawerPosition } = useDrawerPosition();
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const panelSideClass =
    drawerPosition === "left"
      ? "drawer-panel-left left-0 border-r border-border"
      : "drawer-panel-right right-0 border-l border-border";

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
        aria-label={accessibleTitle}
        className={`${panelSideClass} absolute top-0 flex h-full flex-col bg-surface shadow-xl ${widthClass}${entered ? " drawer-open" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-lg font-semibold">{title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {headerTrailing}
              <CloseButton onClick={onClose} />
            </div>
          </div>
        </div>
        {footer ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            <div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
              {footer}
            </div>
          </>
        ) : (
          children
        )}
      </aside>
    </div>
  );
}

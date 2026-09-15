"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";

type TextSelectionToolbarProps = {
  children: React.ReactNode;
  onCheck: (selectedText: string) => void;
};

type ToolbarPosition = {
  top: number;
  left: number;
};

export function TextSelectionToolbar({
  children,
  onCheck,
}: TextSelectionToolbarProps) {
  const t = useT();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const clearToolbar = useCallback(() => {
    setPosition(null);
    setSelectedText("");
  }, []);

  const updateSelection = useCallback(() => {
    const selection = window.getSelection();
    const wrapper = wrapperRef.current;
    if (!selection || selection.isCollapsed || !wrapper) {
      clearToolbar();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!wrapper.contains(range.commonAncestorContainer)) {
      clearToolbar();
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      clearToolbar();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      clearToolbar();
      return;
    }

    setSelectedText(text);
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, [clearToolbar]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (toolbarRef.current?.contains(target)) {
        return;
      }
      if (!wrapperRef.current?.contains(target)) {
        clearToolbar();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        clearToolbar();
      }
    }

    document.addEventListener("mouseup", updateSelection);
    document.addEventListener("selectionchange", updateSelection);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mouseup", updateSelection);
      document.removeEventListener("selectionchange", updateSelection);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [clearToolbar, updateSelection]);

  function handleCheck() {
    if (!selectedText) return;
    onCheck(selectedText);
    window.getSelection()?.removeAllRanges();
    clearToolbar();
  }

  return (
    <div ref={wrapperRef} className="relative">
      {children}
      {position ? (
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label={t("generate.evaluateStep.selection.toolbarAria")}
          className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border bg-surface px-1 py-1 shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded px-2 py-1 text-xs text-muted"
          >
            {t("generate.evaluateStep.selection.ask")}
          </button>
          <button
            type="button"
            onClick={handleCheck}
            className="rounded px-2 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            {t("generate.evaluateStep.selection.check")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GenerateCircleBusySpinner } from "@/components/generate/GenerateCircleBusySpinner";
import { generateCircleButtonClass } from "@/components/generate/generate-nav-button";
import {
  DocxFileIcon,
  DownloadIcon,
  PdfFileIcon,
} from "@/components/shared/icons";

export type ResumeDownloadMenuActions = {
  onDownloadDocx: () => void;
  onDownloadPdf: () => void;
  pdfDisabled: boolean;
};

type ResumeDownloadDropdownProps = ResumeDownloadMenuActions & {
  busy?: boolean;
  ariaLabel: string;
  menuPlacement?: "top" | "bottom";
  buttonClassName?: string;
};

export function ResumeDownloadDropdown({
  onDownloadDocx,
  onDownloadPdf,
  pdfDisabled,
  busy = false,
  ariaLabel,
  menuPlacement = "bottom",
  buttonClassName = generateCircleButtonClass,
}: ResumeDownloadDropdownProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menuPositionClass =
    menuPlacement === "top"
      ? "bottom-full mb-2"
      : "top-full mt-2";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        {busy ? <GenerateCircleBusySpinner /> : <DownloadIcon className="h-6 w-6" />}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={`absolute right-0 z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg ${menuPositionClass}`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDownloadDocx();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
          >
            <DocxFileIcon className="h-5 w-5 shrink-0" />
            <span>{t("generate.download.asDocx")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={pdfDisabled}
            title={
              pdfDisabled ? t("generate.download.pdfEnglishOnly") : undefined
            }
            onClick={() => {
              if (pdfDisabled) return;
              setOpen(false);
              onDownloadPdf();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PdfFileIcon className="h-5 w-5 shrink-0" />
            <span>{t("generate.download.asPdf")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

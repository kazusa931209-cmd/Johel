"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useT } from "@/components/app/LocaleProvider";
import { DownloadIcon, PlayIcon, PlusIcon } from "@/components/shared/icons";

export type GenerateStepNavState = {
  onRun?: () => void;
  onDownload?: () => void;
  runBusy?: boolean;
  downloadBusy?: boolean;
  runDisabled?: boolean;
};

type GenerateStepNavMeta = {
  showRun: boolean;
  showDownload: boolean;
  runBusy: boolean;
  downloadBusy: boolean;
  runDisabled: boolean;
};

const emptyMeta: GenerateStepNavMeta = {
  showRun: false,
  showDownload: false,
  runBusy: false,
  downloadBusy: false,
  runDisabled: false,
};

type GenerateStepNavContextValue = {
  onRunRef: React.RefObject<(() => void) | undefined>;
  onDownloadRef: React.RefObject<(() => void) | undefined>;
  meta: GenerateStepNavMeta;
  setMeta: (meta: GenerateStepNavMeta) => void;
};

const GenerateStepNavContext = createContext<GenerateStepNavContextValue | null>(
  null,
);

export const generateCircleButtonClass =
  "flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface shadow-lg transition-colors hover:bg-surface-muted disabled:opacity-60";

const navSlotClass = "flex h-14 w-14 shrink-0 items-center justify-center";

export function GenerateCircleBusySpinner() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground"
      aria-hidden
    />
  );
}

export function GenerateCircleIconButton({
  icon,
  ariaLabel,
  onClick,
  disabled = false,
  busy = false,
}: {
  icon: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={ariaLabel}
      className={generateCircleButtonClass}
    >
      {busy ? <GenerateCircleBusySpinner /> : icon}
    </button>
  );
}

export function GenerateStepNavProvider({ children }: { children: ReactNode }) {
  const onRunRef = useRef<(() => void) | undefined>(undefined);
  const onDownloadRef = useRef<(() => void) | undefined>(undefined);
  const [meta, setMetaState] = useState<GenerateStepNavMeta>(emptyMeta);

  const setMeta = useCallback((next: GenerateStepNavMeta) => {
    setMetaState((prev) => {
      if (
        prev.showRun === next.showRun &&
        prev.showDownload === next.showDownload &&
        prev.runBusy === next.runBusy &&
        prev.downloadBusy === next.downloadBusy &&
        prev.runDisabled === next.runDisabled
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ onRunRef, onDownloadRef, meta, setMeta }),
    [meta, setMeta],
  );

  return (
    <GenerateStepNavContext.Provider value={value}>
      {children}
    </GenerateStepNavContext.Provider>
  );
}

export function useRegisterGenerateStepNav(nav: GenerateStepNavState) {
  const ctx = useContext(GenerateStepNavContext);

  if (ctx) {
    ctx.onRunRef.current = nav.onRun;
    ctx.onDownloadRef.current = nav.onDownload;
  }

  const showRun = Boolean(nav.onRun);
  const showDownload = Boolean(nav.onDownload);
  const runBusy = nav.runBusy ?? false;
  const downloadBusy = nav.downloadBusy ?? false;
  const runDisabled = nav.runDisabled ?? false;

  useEffect(() => {
    if (!ctx) return;
    ctx.setMeta({ showRun, showDownload, runBusy, downloadBusy, runDisabled });
  }, [
    ctx?.setMeta,
    showRun,
    showDownload,
    runBusy,
    downloadBusy,
    runDisabled,
  ]);

  useEffect(() => {
    if (!ctx) return;
    return () => ctx.setMeta(emptyMeta);
  }, [ctx?.setMeta]);
}

function useGenerateStepNavContext() {
  const ctx = useContext(GenerateStepNavContext);
  if (!ctx) {
    throw new Error(
      "GenerateStepNav components must be used within GenerateStepNavProvider",
    );
  }
  return ctx;
}

export function GenerateNewButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <GenerateCircleIconButton
      onClick={onClick}
      disabled={disabled}
      ariaLabel={t("generate.new")}
      icon={<PlusIcon className="h-6 w-6" />}
    />
  );
}

export function GenerateStepNavRunButton() {
  const { onRunRef, onDownloadRef, meta } = useGenerateStepNavContext();
  const t = useT();
  const showRight = meta.showRun || meta.showDownload;

  if (!showRight) {
    return <div className={navSlotClass} aria-hidden />;
  }

  return (
    <GenerateCircleIconButton
      onClick={() => {
        if (meta.showDownload) {
          onDownloadRef.current?.();
          return;
        }
        onRunRef.current?.();
      }}
      disabled={meta.runBusy || meta.downloadBusy || meta.runDisabled}
      busy={meta.runBusy || meta.downloadBusy}
      ariaLabel={
        meta.showDownload ? t("generate.nav.download") : t("generate.nav.run")
      }
      icon={
        meta.showDownload ? (
          <DownloadIcon className="h-6 w-6" />
        ) : (
          <PlayIcon className="h-6 w-6" />
        )
      }
    />
  );
}

/** @deprecated Use GenerateStepNavRunButton */
export const GenerateStepNavNextButton = GenerateStepNavRunButton;

/** @deprecated Prev removed — use timeline step selection */
export function GenerateStepNavPrevButton() {
  return <div className={navSlotClass} aria-hidden />;
}

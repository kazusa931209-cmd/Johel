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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlusIcon,
} from "@/components/shared/icons";

export type GenerateStepNavState = {
  onPrev?: () => void;
  onNext?: () => void;
  onDownload?: () => void;
  nextBusy?: boolean;
  downloadBusy?: boolean;
};

type GenerateStepNavMeta = {
  showPrev: boolean;
  showNext: boolean;
  showDownload: boolean;
  nextBusy: boolean;
  downloadBusy: boolean;
};

const emptyMeta: GenerateStepNavMeta = {
  showPrev: false,
  showNext: false,
  showDownload: false,
  nextBusy: false,
  downloadBusy: false,
};

type GenerateStepNavContextValue = {
  onPrevRef: React.RefObject<(() => void) | undefined>;
  onNextRef: React.RefObject<(() => void) | undefined>;
  onDownloadRef: React.RefObject<(() => void) | undefined>;
  meta: GenerateStepNavMeta;
  setMeta: (meta: GenerateStepNavMeta) => void;
};

const GenerateStepNavContext = createContext<GenerateStepNavContextValue | null>(
  null,
);

const circleButtonClass =
  "flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface shadow-lg transition-colors hover:bg-surface-muted disabled:opacity-60";

const navSlotClass = "flex h-14 w-14 shrink-0 items-center justify-center";

function BusySpinner() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground"
      aria-hidden
    />
  );
}

export function GenerateStepNavProvider({ children }: { children: ReactNode }) {
  const onPrevRef = useRef<(() => void) | undefined>(undefined);
  const onNextRef = useRef<(() => void) | undefined>(undefined);
  const onDownloadRef = useRef<(() => void) | undefined>(undefined);
  const [meta, setMetaState] = useState<GenerateStepNavMeta>(emptyMeta);

  const setMeta = useCallback((next: GenerateStepNavMeta) => {
    setMetaState((prev) => {
      if (
        prev.showPrev === next.showPrev &&
        prev.showNext === next.showNext &&
        prev.showDownload === next.showDownload &&
        prev.nextBusy === next.nextBusy &&
        prev.downloadBusy === next.downloadBusy
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ onPrevRef, onNextRef, onDownloadRef, meta, setMeta }),
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
    ctx.onPrevRef.current = nav.onPrev;
    ctx.onNextRef.current = nav.onNext;
    ctx.onDownloadRef.current = nav.onDownload;
  }

  const showPrev = Boolean(nav.onPrev);
  const showNext = Boolean(nav.onNext);
  const showDownload = Boolean(nav.onDownload);
  const nextBusy = nav.nextBusy ?? false;
  const downloadBusy = nav.downloadBusy ?? false;

  useEffect(() => {
    if (!ctx) return;
    ctx.setMeta({ showPrev, showNext, showDownload, nextBusy, downloadBusy });
  }, [ctx?.setMeta, showPrev, showNext, showDownload, nextBusy, downloadBusy]);

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("generate.new")}
      className={circleButtonClass}
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
}

export function GenerateStepNavPrevButton() {
  const { onPrevRef, meta } = useGenerateStepNavContext();
  const t = useT();

  if (!meta.showPrev) {
    return <div className={navSlotClass} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => onPrevRef.current?.()}
      aria-label={t("generate.nav.previous")}
      className={circleButtonClass}
    >
      <ChevronLeftIcon className="h-6 w-6" />
    </button>
  );
}

export function GenerateStepNavNextButton() {
  const { onNextRef, onDownloadRef, meta } = useGenerateStepNavContext();
  const t = useT();
  const showRight = meta.showNext || meta.showDownload;

  if (!showRight) {
    return <div className={navSlotClass} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (meta.showDownload) {
          onDownloadRef.current?.();
          return;
        }
        onNextRef.current?.();
      }}
      disabled={meta.nextBusy || meta.downloadBusy}
      aria-label={
        meta.showDownload ? t("generate.nav.download") : t("generate.nav.next")
      }
      className={circleButtonClass}
    >
      {meta.nextBusy || meta.downloadBusy ? (
        <BusySpinner />
      ) : meta.showDownload ? (
        <DownloadIcon className="h-6 w-6" />
      ) : (
        <ChevronRightIcon className="h-6 w-6" />
      )}
    </button>
  );
}

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
import { GenerateCircleBusySpinner } from "@/components/generate/GenerateCircleBusySpinner";
import { generateCircleButtonClass } from "@/components/generate/generate-nav-button";
import {
  ResumeDownloadDropdown,
  type ResumeDownloadMenuActions,
} from "@/components/generate/ResumeDownloadDropdown";
import { PlayIcon, PlusIcon } from "@/components/shared/icons";

export { generateCircleButtonClass } from "@/components/generate/generate-nav-button";
export { GenerateCircleBusySpinner } from "@/components/generate/GenerateCircleBusySpinner";

export type GenerateStepNavState = {
  onRun?: () => void;
  downloadMenu?: ResumeDownloadMenuActions;
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
  downloadMenuRef: React.RefObject<ResumeDownloadMenuActions | undefined>;
  meta: GenerateStepNavMeta;
  setMeta: (meta: GenerateStepNavMeta) => void;
};

const GenerateStepNavContext = createContext<GenerateStepNavContextValue | null>(
  null,
);

const navSlotClass = "flex h-14 w-14 shrink-0 items-center justify-center";

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
  const downloadMenuRef = useRef<ResumeDownloadMenuActions | undefined>(
    undefined,
  );
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
    () => ({ onRunRef, downloadMenuRef, meta, setMeta }),
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
    ctx.downloadMenuRef.current = nav.downloadMenu;
  }

  const showRun = Boolean(nav.onRun);
  const showDownload = Boolean(nav.downloadMenu);
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
  const { onRunRef, downloadMenuRef, meta } = useGenerateStepNavContext();
  const t = useT();
  const showRight = meta.showRun || meta.showDownload;

  if (!showRight) {
    return <div className={navSlotClass} aria-hidden />;
  }

  if (meta.showDownload && downloadMenuRef.current) {
    const menu = downloadMenuRef.current;
    return (
      <ResumeDownloadDropdown
        {...menu}
        busy={meta.downloadBusy}
        ariaLabel={t("generate.nav.download")}
        menuPlacement="bottom"
      />
    );
  }

  return (
    <GenerateCircleIconButton
      onClick={() => onRunRef.current?.()}
      disabled={meta.runBusy || meta.downloadBusy || meta.runDisabled}
      busy={meta.runBusy || meta.downloadBusy}
      ariaLabel={t("generate.nav.run")}
      icon={<PlayIcon className="h-6 w-6" />}
    />
  );
}

/** @deprecated Use GenerateStepNavRunButton */
export const GenerateStepNavNextButton = GenerateStepNavRunButton;

/** @deprecated Prev removed — use timeline step selection */
export function GenerateStepNavPrevButton() {
  return <div className={navSlotClass} aria-hidden />;
}

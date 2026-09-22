"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useT } from "@/components/app/LocaleProvider";
import { GripVerticalIcon } from "@/components/shared/icons";
import {
  DEFAULT_GENERATE_PANEL_LEFT_PERCENT,
  clampGeneratePanelLeftPercent,
  getStoredGeneratePanelLeftPercent,
  MAX_GENERATE_PANEL_LEFT_PERCENT,
  MIN_GENERATE_PANEL_LEFT_PERCENT,
  persistGeneratePanelLeftPercent,
} from "@/lib/generate-panel-split";

type GenerateStepLayoutProps = {
  previousTitle?: ReactNode;
  previous?: ReactNode;
  previousHeaderRight?: ReactNode;
  currentTitle?: string;
  currentHeaderRight?: ReactNode;
  currentFooter?: ReactNode;
  swapColumns?: boolean;
  previousFill?: boolean;
  currentFill?: boolean;
  children: ReactNode;
};

function StepPanel({
  title,
  headerRight,
  footer,
  children,
  fill,
}: {
  title?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}) {
  const showHeader = Boolean(title || headerRight);
  const bodyClassName = `flex min-h-0 flex-1 flex-col px-4 py-4 ${
    fill ? "overflow-hidden" : "overflow-y-auto"
  }`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface">
      {showHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title ? (
            typeof title === "string" ? (
              <h2 className="text-xl font-semibold tracking-tight leading-8">
                {title}
              </h2>
            ) : (
              <div className="min-w-0">{title}</div>
            )
          ) : (
            <span />
          )}
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      ) : null}
      {footer ? (
        <>
          <div className={bodyClassName}>{children}</div>
          <div className="flex shrink-0 items-center border-t border-border px-4 py-3">
            {footer}
          </div>
        </>
      ) : (
        <div className={bodyClassName}>{children}</div>
      )}
    </div>
  );
}

function Column({
  children,
  widthClassName,
}: {
  children: ReactNode;
  widthClassName: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col max-lg:max-h-[50vh] max-lg:w-full lg:max-h-none ${widthClassName}`}
    >
      {children}
    </div>
  );
}

function PanelResizeHandle({
  leftPercent,
  onResize,
  onResizeEnd,
}: {
  leftPercent: number;
  onResize: (percent: number) => void;
  onResizeEnd: (percent: number) => void;
}) {
  const t = useT();
  const draggingRef = useRef(false);
  const leftPercentRef = useRef(leftPercent);
  leftPercentRef.current = leftPercent;

  const updateFromClientX = useCallback(
    (clientX: number, container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      onResize(clampGeneratePanelLeftPercent(percent));
    },
    [onResize],
  );

  const endDrag = useCallback(
    (container: HTMLElement | null) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      container?.ownerDocument.body.classList.remove("select-none");
      onResizeEnd(leftPercentRef.current);
    },
    [onResizeEnd],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuemin={MIN_GENERATE_PANEL_LEFT_PERCENT}
      aria-valuemax={MAX_GENERATE_PANEL_LEFT_PERCENT}
      aria-valuenow={Math.round(leftPercent)}
      aria-label={t("generate.layout.resizePanels")}
      tabIndex={0}
      className="group relative hidden w-6 shrink-0 touch-none cursor-col-resize items-center justify-center lg:flex"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const container = event.currentTarget.parentElement;
        if (!container) return;
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        container.ownerDocument.body.classList.add("select-none");
        updateFromClientX(event.clientX, container);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        const container = event.currentTarget.parentElement;
        if (!container) return;
        updateFromClientX(event.clientX, container);
      }}
      onPointerUp={(event) => {
        const container = event.currentTarget.parentElement;
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        endDrag(container);
      }}
      onPointerCancel={(event) => {
        const container = event.currentTarget.parentElement;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        endDrag(container);
      }}
      onLostPointerCapture={(event) => {
        endDrag(event.currentTarget.parentElement);
      }}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" aria-hidden />
      <div className="h-full w-px bg-border transition-colors group-hover:bg-muted group-active:bg-muted" />
      <GripVerticalIcon className="pointer-events-none absolute h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export function GenerateStepLayout({
  previousTitle,
  previous,
  previousHeaderRight,
  currentTitle,
  currentHeaderRight,
  currentFooter,
  swapColumns = false,
  previousFill = false,
  currentFill = false,
  children,
}: GenerateStepLayoutProps) {
  const t = useT();
  const [leftPercent, setLeftPercent] = useState(
    DEFAULT_GENERATE_PANEL_LEFT_PERCENT,
  );

  useEffect(() => {
    setLeftPercent(getStoredGeneratePanelLeftPercent());
  }, []);

  const handleResize = useCallback((percent: number) => {
    setLeftPercent(percent);
  }, []);

  const handleResizeEnd = useCallback((percent: number) => {
    persistGeneratePanelLeftPercent(percent);
  }, []);

  const previousPanel = (
    <StepPanel
      title={previousTitle}
      headerRight={previousHeaderRight}
      fill={previousFill}
    >
      {previous ?? (
        <span className="sr-only">{t("generate.layout.emptyPrevious")}</span>
      )}
    </StepPanel>
  );

  const currentPanel = (
    <StepPanel
      title={currentTitle}
      headerRight={currentHeaderRight}
      footer={currentFooter}
      fill={currentFill}
    >
      {children}
    </StepPanel>
  );

  const leftPanel = swapColumns ? currentPanel : previousPanel;
  const rightPanel = swapColumns ? previousPanel : currentPanel;

  const panelSplitStyle = {
    "--generate-left-panel": `${leftPercent}%`,
    "--generate-right-panel": `${100 - leftPercent}%`,
  } as CSSProperties;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row lg:gap-0"
      style={panelSplitStyle}
    >
      <Column widthClassName="lg:w-[calc(var(--generate-left-panel)-0.75rem)]">
        {leftPanel}
      </Column>

      <PanelResizeHandle
        leftPercent={leftPercent}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
      />

      <Column widthClassName="lg:w-[calc(var(--generate-right-panel)-0.75rem)]">
        {rightPanel}
      </Column>
    </div>
  );
}

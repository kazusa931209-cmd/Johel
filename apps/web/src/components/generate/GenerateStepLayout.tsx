"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";

type GenerateStepLayoutProps = {
  previousTitle?: string;
  previous?: ReactNode;
  previousHeaderRight?: ReactNode;
  currentTitle?: string;
  currentHeaderRight?: ReactNode;
  swapColumns?: boolean;
  currentFill?: boolean;
  children: ReactNode;
};

function StepPanel({
  title,
  headerRight,
  children,
  fill,
}: {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}) {
  const showHeader = Boolean(title || headerRight);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface">
      {showHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title ? (
            <h2 className="text-xl font-semibold tracking-tight leading-8">{title}</h2>
          ) : (
            <span />
          )}
          {headerRight ? (
            <div className="shrink-0 text-xs tabular-nums text-muted">
              {headerRight}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 ${
          fill ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Column({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col max-lg:max-h-[50vh] lg:max-h-none">
      {children}
    </div>
  );
}

export function GenerateStepLayout({
  previousTitle,
  previous,
  previousHeaderRight,
  currentTitle,
  currentHeaderRight,
  swapColumns = false,
  currentFill = false,
  children,
}: GenerateStepLayoutProps) {
  const t = useT();

  const previousColumn = (
    <Column>
      <StepPanel title={previousTitle} headerRight={previousHeaderRight}>
        {previous ?? (
          <span className="sr-only">{t("generate.layout.emptyPrevious")}</span>
        )}
      </StepPanel>
    </Column>
  );

  const currentColumn = (
    <Column>
      <StepPanel
        title={currentTitle}
        headerRight={currentHeaderRight}
        fill={currentFill}
      >
        {children}
      </StepPanel>
    </Column>
  );

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 lg:h-full lg:grid-cols-2 lg:gap-6">
      {swapColumns ? (
        <>
          {currentColumn}
          {previousColumn}
        </>
      ) : (
        <>
          {previousColumn}
          {currentColumn}
        </>
      )}
    </div>
  );
}

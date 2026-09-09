"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";

type GenerateStepLayoutProps = {
  previousTitle?: string;
  previous?: ReactNode;
  currentTitle?: string;
  children: ReactNode;
};

function StepPanel({
  title,
  children,
  variant,
}: {
  title?: string;
  children: ReactNode;
  variant: "previous" | "current";
}) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface ${
        variant === "previous" ? "bg-background" : ""
      }`}
    >
      {title ? (
        <div className="shrink-0 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}

export function GenerateStepLayout({
  previousTitle,
  previous,
  currentTitle,
  children,
}: GenerateStepLayoutProps) {
  const t = useT();

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 lg:h-full lg:grid-cols-2 lg:gap-6">
      <div className="flex min-h-0 flex-col max-lg:max-h-[50vh] lg:max-h-none">
        <StepPanel
          title={previousTitle}
          variant="previous"
        >
          {previous ?? (
            <span className="sr-only">{t("generate.layout.emptyPrevious")}</span>
          )}
        </StepPanel>
      </div>
      <div className="flex min-h-0 flex-col max-lg:max-h-[50vh] lg:max-h-none">
        <StepPanel title={currentTitle} variant="current">
          {children}
        </StepPanel>
      </div>
    </div>
  );
}

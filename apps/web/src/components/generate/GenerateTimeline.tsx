"use client";

import { useT } from "@/components/app/LocaleProvider";

export const GENERATE_STEPS = [
  "Job",
  "Verdict",
  "Combine",
  "Generate",
  "Evaluate",
] as const;

export type GenerateStep = (typeof GENERATE_STEPS)[number];

const STEP_LABEL_KEYS: Record<GenerateStep, string> = {
  Job: "generate.steps.job",
  Verdict: "generate.steps.verdict",
  Combine: "generate.steps.combine",
  Generate: "generate.steps.generate",
  Evaluate: "generate.steps.evaluate",
};

type GenerateTimelineProps = {
  active: GenerateStep;
  steps: readonly GenerateStep[];
  onStepSelect?: (step: GenerateStep) => void;
};

export function GenerateTimeline({
  active,
  steps,
  onStepSelect,
}: GenerateTimelineProps) {
  const t = useT();

  return (
    <nav
      aria-label={t("generate.steps.ariaLabel")}
      className="w-full overflow-x-auto overflow-y-hidden"
    >
      <ol className="flex min-w-[320px] items-center gap-1">
        {steps.map((step, index) => {
          const isActive = step === active;
          const content = (
            <>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                  isActive
                    ? "border-foreground bg-accent text-accent-fg"
                    : "border-border"
                }`}
              >
                {index + 1}
              </span>
              <span>{t(STEP_LABEL_KEYS[step])}</span>
            </>
          );
          const className = `flex w-full flex-col items-center gap-1 rounded-md px-2 py-2 text-center text-xs sm:text-sm ${
            isActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted"
          }`;

          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-1">
              {onStepSelect ? (
                <button
                  type="button"
                  onClick={() => onStepSelect(step)}
                  className={`${className} hover:bg-surface-muted`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={className}
                  aria-current={isActive ? "step" : undefined}
                >
                  {content}
                </div>
              )}
              {index < steps.length - 1 ? (
                <span
                  className="hidden h-px w-4 shrink-0 bg-border sm:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

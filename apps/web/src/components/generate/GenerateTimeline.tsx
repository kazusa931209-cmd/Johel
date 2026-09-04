"use client";

export const GENERATE_STEPS = [
  "Job",
  "PCEW",
  "Verdict",
  "Company",
  "Generate",
] as const;

export type GenerateStep = (typeof GENERATE_STEPS)[number];

type GenerateTimelineProps = {
  active: GenerateStep;
};

export function GenerateTimeline({ active }: GenerateTimelineProps) {
  return (
    <nav aria-label="Generate steps" className="w-full overflow-x-auto">
      <ol className="flex min-w-[520px] items-center gap-1">
        {GENERATE_STEPS.map((step, index) => {
          const isActive = step === active;
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-1">
              <div
                className={`flex w-full flex-col items-center gap-1 rounded-md px-2 py-2 text-center text-xs sm:text-sm ${
                  isActive
                    ? "bg-surface-muted font-medium text-foreground"
                    : "text-muted"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                    isActive
                      ? "border-foreground bg-accent text-accent-fg"
                      : "border-border"
                  }`}
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
              {index < GENERATE_STEPS.length - 1 ? (
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

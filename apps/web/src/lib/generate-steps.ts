import type { GenerateStep } from "@/components/generate/GenerateTimeline";

export const ALL_GENERATE_STEPS = [
  "Job",
  "Workflow",
  "Generate",
  "Evaluate",
] as const;

export function getGenerateSteps(doEvaluate: boolean): GenerateStep[] {
  if (doEvaluate) {
    return ["Job", "Workflow", "Generate", "Evaluate"];
  }
  return ["Job", "Workflow", "Generate"];
}

export function getAdjacentGenerateStep(
  steps: readonly GenerateStep[],
  current: GenerateStep,
  direction: "prev" | "next",
): GenerateStep | null {
  const index = steps.indexOf(current);
  if (index < 0) return null;
  const nextIndex = direction === "prev" ? index - 1 : index + 1;
  return steps[nextIndex] ?? null;
}

export function normalizeGenerateActiveStep(
  activeStep: GenerateStep,
  doEvaluate: boolean,
): GenerateStep {
  if (!doEvaluate && activeStep === "Evaluate") {
    return "Generate";
  }
  const steps = getGenerateSteps(doEvaluate);
  return steps.includes(activeStep) ? activeStep : "Job";
}

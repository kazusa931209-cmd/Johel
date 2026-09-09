import type { GenerateStep } from "@/components/generate/GenerateTimeline";

export function getGenerateSteps(
  doEvaluate: boolean,
  doVerdict: boolean,
): GenerateStep[] {
  const steps: GenerateStep[] = ["Job"];
  if (doVerdict) {
    steps.push("Verdict");
  }
  steps.push("Combine", "Generate");
  if (doEvaluate) {
    steps.push("Evaluate");
  }
  return steps;
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

export function isGenerationAtLastStep(
  activeStep: GenerateStep,
  visibleSteps: readonly GenerateStep[],
): boolean {
  const lastStep = visibleSteps[visibleSteps.length - 1];
  return activeStep === lastStep;
}

export function needsNewGenerationConfirm(
  activeStep: GenerateStep,
  visibleSteps: readonly GenerateStep[],
): boolean {
  return !isGenerationAtLastStep(activeStep, visibleSteps);
}

export function normalizeGenerateActiveStep(
  activeStep: GenerateStep,
  doEvaluate: boolean,
  doVerdict: boolean,
): GenerateStep {
  const steps = getGenerateSteps(doEvaluate, doVerdict);
  if (!doEvaluate && activeStep === "Evaluate") {
    return "Generate";
  }
  if (!doVerdict && activeStep === "Verdict") {
    return "Combine";
  }
  return steps.includes(activeStep) ? activeStep : "Job";
}

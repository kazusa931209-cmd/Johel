import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import {
  isGenerationAtLastStep,
  needsNewGenerationConfirm,
} from "@/lib/generate-steps";

export const RESUME_BUILDER_STEPS: readonly GenerateStep[] = [
  "Combine",
  "Generate",
  "Evaluate",
];

export type ResumeBuilderStep = (typeof RESUME_BUILDER_STEPS)[number];

export function normalizeResumeBuilderActiveStep(
  activeStep: GenerateStep,
): ResumeBuilderStep {
  if (
    (RESUME_BUILDER_STEPS as readonly string[]).includes(activeStep)
  ) {
    return activeStep as ResumeBuilderStep;
  }
  return "Combine";
}

export function needsNewGeneralResumeConfirm(activeStep: GenerateStep): boolean {
  return needsNewGenerationConfirm(activeStep, RESUME_BUILDER_STEPS);
}

export function isGeneralResumeAtLastStep(activeStep: GenerateStep): boolean {
  return isGenerationAtLastStep(activeStep, RESUME_BUILDER_STEPS);
}

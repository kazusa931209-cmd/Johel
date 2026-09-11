import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { GenerateSession } from "@/lib/generate-session";
import { getGenerateSteps } from "@/lib/generate-steps";
import { isGenerateStep } from "@/lib/generate-step-labels";

const STEP_ORDER: Record<GenerateStep, number> = {
  Job: 0,
  Verdict: 1,
  Combine: 2,
  Generate: 3,
  Evaluate: 4,
};

export function normalizeProcessedStep(value: string): GenerateStep {
  if (isGenerateStep(value)) {
    return value;
  }
  if (value === "Workflow" || value === "PCEW" || value === "Company") {
    return "Combine";
  }
  return "Job";
}

export function isProcessedThroughStep(
  step: GenerateStep,
  processedStep: string,
): boolean {
  const processed = normalizeProcessedStep(processedStep);
  return STEP_ORDER[step] <= STEP_ORDER[processed];
}

export function getHistoryVisibleSteps(
  doEvaluate: boolean,
  doVerdict: boolean,
): GenerateStep[] {
  return getGenerateSteps(doEvaluate, doVerdict);
}

export function deriveProcessedStepFromSession(
  session: Pick<
    GenerateSession,
    "activeStep" | "job" | "combine" | "resume" | "evaluationMarkdown"
  >,
): GenerateStep {
  if (session.evaluationMarkdown?.trim()) {
    return "Evaluate";
  }
  if (session.resume) {
    return "Generate";
  }

  const active = normalizeProcessedStep(session.activeStep);
  const hasCombineSelection =
    Boolean(session.combine.profileId?.trim()) ||
    (session.combine.companies?.length ?? 0) > 0;

  // Remembered Combine defaults are pre-filled on + New before the user reaches
  // Combine; only count them once the timeline active step is Combine or later.
  if (STEP_ORDER[active] >= STEP_ORDER.Combine && hasCombineSelection) {
    return "Combine";
  }

  if (session.job.acceptedMarkdown?.trim()) {
    return "Verdict";
  }
  if (session.job.jobText?.trim()) {
    return "Job";
  }
  return active;
}

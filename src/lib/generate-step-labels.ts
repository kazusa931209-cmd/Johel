import type { GenerateStep } from "@/components/generate/GenerateTimeline";

export const GENERATE_STEP_LABEL_KEYS: Record<GenerateStep, string> = {
  Job: "generate.steps.job",
  Verdict: "generate.steps.verdict",
  Combine: "generate.steps.combine",
  Generate: "generate.steps.generate",
  Evaluate: "generate.steps.evaluate",
};

export function isGenerateStep(value: string): value is GenerateStep {
  return value in GENERATE_STEP_LABEL_KEYS;
}

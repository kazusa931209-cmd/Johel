import type { GenerationStatus } from "@/lib/api";
import type { GenerateSession } from "@/lib/generate-session";

export type GenerationLifecycleStatus = GenerationStatus;

export function deriveLifecycleStatusFromSession(
  session: Pick<
    GenerateSession,
    "finalized" | "evaluationMarkdown" | "resume"
  >,
  doEvaluate: boolean,
): GenerationLifecycleStatus {
  if (session.finalized) {
    return "finalized";
  }
  if (session.evaluationMarkdown?.trim()) {
    return "completed";
  }
  if (!doEvaluate && session.resume) {
    return "completed";
  }
  return "in_progress";
}

export function deriveLifecycleStatusFromRecord(input: {
  status: string;
  evaluationMarkdown: string | null;
  doEvaluate: boolean;
  resume: unknown;
}): GenerationLifecycleStatus {
  if (input.status === "finalized") {
    return "finalized";
  }
  if (input.status === "completed") {
    return "completed";
  }
  if (input.evaluationMarkdown?.trim()) {
    return "completed";
  }
  if (!input.doEvaluate && input.resume) {
    return "completed";
  }
  return "in_progress";
}

export function resolvePersistedGenerationStatus(
  session: Pick<
    GenerateSession,
    "finalized" | "evaluationMarkdown" | "resume"
  >,
  doEvaluate: boolean,
): Extract<GenerationLifecycleStatus, "completed" | "finalized"> | undefined {
  if (session.finalized) {
    return "finalized";
  }
  if (session.evaluationMarkdown?.trim()) {
    return "completed";
  }
  if (!doEvaluate && session.resume) {
    return "completed";
  }
  return undefined;
}

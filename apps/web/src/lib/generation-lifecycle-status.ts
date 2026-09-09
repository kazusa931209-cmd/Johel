import type { GenerateSession } from "@/lib/generate-session";

export type GenerationLifecycleStatus = "in_progress" | "completed" | "finalized";

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

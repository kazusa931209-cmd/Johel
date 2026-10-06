import type { GeneratedResume } from "@johel/resume";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import {
  hashResumeForCache,
  LABELED_USER_MESSAGE_VERSION,
} from "@/lib/generate-session";

export function buildGeneralGenerationInputKey(
  generationId: string,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
): string {
  return JSON.stringify({
    labeledUserMessageVersion: LABELED_USER_MESSAGE_VERSION,
    kind: "generalResume",
    generationId,
    combine,
    combineContentFingerprint,
  });
}

export function buildGeneralEvaluationInputKey(
  generationId: string,
  combine: CombineSnapshot,
  combineContentFingerprint: string,
  resume: GeneratedResume | null,
): string {
  return JSON.stringify({
    labeledUserMessageVersion: LABELED_USER_MESSAGE_VERSION,
    kind: "generalResume",
    generationId,
    combine,
    combineContentFingerprint,
    resumeHash: hashResumeForCache(resume),
  });
}

import type { GeneratedResume } from "@johel/resume";
import type { GenerateStep } from "@/components/generate/GenerateTimeline";
import type { CombineSnapshot } from "@/components/generate/combine-types";
import type { GenerateJobState } from "@/lib/generate-session";
import {
  startGeneration,
  updateGeneration,
  type GenerationStatus,
} from "@/lib/api";

export type GenerationSnapshot = {
  generationId: string;
  activeStep: GenerateStep;
  job: GenerateJobState;
  combine: CombineSnapshot;
  resume: GeneratedResume | null;
  evaluationMarkdown: string | null;
  status?: GenerationStatus;
};

export function buildGenerationUpdatePayload(snapshot: GenerationSnapshot) {
  return {
    activeStep: snapshot.activeStep,
    job: snapshot.job,
    combine: snapshot.combine,
    verdictMarkdown: snapshot.job.acceptedMarkdown,
    resume: snapshot.resume,
    evaluationMarkdown: snapshot.evaluationMarkdown,
    status: snapshot.status,
  };
}

export async function persistGenerationSnapshot(snapshot: GenerationSnapshot) {
  return updateGeneration(
    snapshot.generationId,
    buildGenerationUpdatePayload(snapshot),
  );
}

export async function allocateNewGeneration() {
  return startGeneration();
}

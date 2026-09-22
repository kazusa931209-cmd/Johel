import { openAiExperienceAdviseProvider } from "./providers";
import type {
  ExperienceAdviseProviderResult,
  ExperienceAdviseRequest,
} from "./types";
import type { AiProviderId } from "../ai-provider";

export type {
  ExperienceAdviseApplyInput,
  ExperienceAdviseApplyOperation,
  ExperienceAdviseApplyResult,
  ExperienceAdviseDraft,
  ExperienceAdviseGraph,
  ExperienceAdviseOperation,
  ExperienceAdvisePlacement,
  ExperienceAdviseResult,
} from "./types";

export { loadExperienceAdviseGraph } from "./load-graph";
export {
  loadExperienceAdviseContext,
  buildExperienceAdviseFingerprintFromGraph,
} from "./load-context";
export { buildExperienceAdviseFingerprint } from "./fingerprint";
export {
  parseExperienceAdviseResponse,
  validateExperienceAdviseResult,
} from "./parse-response";
export { applyExperienceAdviseOperations } from "./apply";

export async function runExperienceAdvise(
  _provider: AiProviderId,
  input: ExperienceAdviseRequest,
): Promise<ExperienceAdviseProviderResult> {
  return openAiExperienceAdviseProvider.run(input);
}

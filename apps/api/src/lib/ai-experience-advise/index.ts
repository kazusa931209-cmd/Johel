import { openAiExperienceAdviseProvider } from "./providers.js";
import type {
  ExperienceAdviseProviderResult,
  ExperienceAdviseRequest,
} from "./types.js";
import type { AiProviderId } from "../ai-provider.js";

export type {
  ExperienceAdviseApplyInput,
  ExperienceAdviseApplyOperation,
  ExperienceAdviseApplyResult,
  ExperienceAdviseDraft,
  ExperienceAdviseGraph,
  ExperienceAdviseOperation,
  ExperienceAdvisePlacement,
  ExperienceAdviseResult,
} from "./types.js";

export { loadExperienceAdviseGraph } from "./load-graph.js";
export {
  loadExperienceAdviseContext,
  buildExperienceAdviseFingerprintFromGraph,
} from "./load-context.js";
export { buildExperienceAdviseFingerprint } from "./fingerprint.js";
export {
  parseExperienceAdviseResponse,
  validateExperienceAdviseResult,
} from "./parse-response.js";
export { applyExperienceAdviseOperations } from "./apply.js";

export async function runExperienceAdvise(
  _provider: AiProviderId,
  input: ExperienceAdviseRequest,
): Promise<ExperienceAdviseProviderResult> {
  return openAiExperienceAdviseProvider.run(input);
}

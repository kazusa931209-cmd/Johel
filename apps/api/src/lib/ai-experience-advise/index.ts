import type { AiProviderId } from "../ai-provider.js";
import {
  cursorExperienceAdviseProvider,
  openAiExperienceAdviseProvider,
} from "./providers.js";
import type {
  ExperienceAdviseProviderResult,
  ExperienceAdviseRequest,
} from "./types.js";

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
export { buildExperienceAdviseFingerprint } from "./fingerprint.js";
export {
  parseExperienceAdviseResponse,
  validateExperienceAdviseResult,
} from "./parse-response.js";
export { applyExperienceAdviseOperations } from "./apply.js";

const providers = {
  cursor: cursorExperienceAdviseProvider,
  openai: openAiExperienceAdviseProvider,
} as const;

export async function runExperienceAdvise(
  provider: AiProviderId,
  input: ExperienceAdviseRequest,
): Promise<ExperienceAdviseProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

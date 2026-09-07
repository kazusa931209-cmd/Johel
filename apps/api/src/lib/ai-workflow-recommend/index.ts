import { cursorWorkflowRecommendProvider } from "./cursor-provider.js";
import { openAiWorkflowRecommendProvider } from "./openai-provider.js";
import type {
  AiProviderId,
  WorkflowRecommendProviderResult,
  WorkflowRecommendRequest,
} from "./types.js";

export type {
  WorkflowRecommendMatch,
  WorkflowRecommendRequest,
  WorkflowRecommendSummary,
  WorkflowRecommendUsage,
} from "./types.js";
export { pickRecommendedWorkflow } from "./pick-workflow.js";

const providers = {
  cursor: cursorWorkflowRecommendProvider,
  openai: openAiWorkflowRecommendProvider,
} as const;

export async function runAiWorkflowRecommend(
  provider: AiProviderId,
  input: WorkflowRecommendRequest,
): Promise<WorkflowRecommendProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

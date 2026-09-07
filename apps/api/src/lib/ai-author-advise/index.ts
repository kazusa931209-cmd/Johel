import { cursorAuthorAdviseProvider } from "./cursor-provider.js";
import { openAiAuthorAdviseProvider } from "./openai-provider.js";
import type {
  AiProviderId,
  AuthorAdviseProviderResult,
  AuthorAdviseRequest,
} from "./types.js";

export type {
  AuthorAdviseDraft,
  AuthorAdviseGraph,
  AuthorAdviseLink,
  AuthorAdvisePlacement,
  AuthorAdviseProposal,
  AuthorAdviseTarget,
  AuthorAdviseUsage,
  AuthorAdviseWorkflowGraph,
} from "./types.js";

export { loadAuthorAdviseGraph } from "./load-graph.js";
export { buildAuthorAdviseWorkspaceFingerprint } from "./fingerprint.js";
export { parseAuthorAdviseResponse, validateAuthorAdviseProposalShape } from "./parse-response.js";
export { applyAuthorAdviseProposal } from "./apply.js";

const providers = {
  cursor: cursorAuthorAdviseProvider,
  openai: openAiAuthorAdviseProvider,
} as const;

export async function runAuthorAdvise(
  provider: AiProviderId,
  input: AuthorAdviseRequest,
): Promise<AuthorAdviseProviderResult> {
  const adapter = providers[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  return adapter.run(input);
}

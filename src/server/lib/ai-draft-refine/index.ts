import { openAiDraftRefineProvider } from "./openai-provider";
import type {
  DraftRefineProviderResult,
  DraftRefineRequest,
} from "./types";
import type { AiProviderId } from "../ai-provider";

export type { DraftRefineInput, DraftRefineMode } from "./types";

export async function runAiDraftRefine(
  _provider: AiProviderId,
  input: DraftRefineRequest,
): Promise<DraftRefineProviderResult> {
  return openAiDraftRefineProvider.run(input);
}

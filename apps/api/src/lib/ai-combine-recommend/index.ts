import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { runOpenAiAuthorAdviseResponse } from "../openai/responses.js";
import { loadExperienceIndex } from "./load-index.js";
import {
  buildCombineRecommendUserPrompt,
  getCombineRecommendSystemPrompt,
} from "./prompts.js";
import { parseCombineRecommendResponse } from "./parse-response.js";
import {
  buildUsage,
  type CombineRecommendProviderResult,
  type CombineRecommendRequest,
  type CombineRecommendRunCompany,
} from "./types.js";

export { loadExperienceIndex };

export type CombineRecommendRunInput = Omit<
  CombineRecommendRequest,
  "companies"
> & {
  companies: CombineRecommendRunCompany[];
  experienceIndex: Array<{
    id: string;
    category: string;
    problemSummary: string;
  }>;
};

export async function runCombineRecommendCursor(
  input: CombineRecommendRunInput,
): Promise<CombineRecommendProviderResult> {
  const system = getCombineRecommendSystemPrompt("cursor");
  const user = buildCombineRecommendUserPrompt(input);
  const prompt = `${system}\n\n${user}`;
  const allowedExperienceIds = new Set(
    input.experienceIndex.map((item) => item.id),
  );
  const allowedCompanyIds = new Set(
    input.companies.map((item) => item.companyId),
  );

  try {
    const result: RunResult = await Agent.prompt(prompt, {
      apiKey: input.apiKey,
      model: { id: "auto" },
      local: { cwd: process.cwd() },
    });

    if (result.status === "error") {
      throw new Error(result.error?.message || "Cursor AI Agent run failed.");
    }

    const raw = (result.result ?? "").trim();
    const parsed = parseCombineRecommendResponse(
      raw,
      allowedExperienceIds,
      allowedCompanyIds,
    );
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    return {
      result: parsed.result,
      usage: buildUsage(prompt, raw, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      }),
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(
        err.message || "Cursor AI Agent failed to start. Check the API key.",
      );
    }
    throw err;
  }
}

export async function runCombineRecommendOpenAi(
  input: CombineRecommendRunInput,
): Promise<CombineRecommendProviderResult> {
  const instructions = getCombineRecommendSystemPrompt("openai");
  const user = buildCombineRecommendUserPrompt(input);
  const allowedExperienceIds = new Set(
    input.experienceIndex.map((item) => item.id),
  );
  const allowedCompanyIds = new Set(
    input.companies.map((item) => item.companyId),
  );

  const response = await runOpenAiAuthorAdviseResponse(
    input.apiKey,
    instructions,
    user,
  );

  const parsed = parseCombineRecommendResponse(
    response.outputText,
    allowedExperienceIds,
    allowedCompanyIds,
  );
  if (!parsed.success) {
    throw new Error(parsed.error);
  }

  return {
    result: parsed.result,
    usage: buildUsage(`${instructions}\n\n${user}`, response.outputText, {
      inputToken: response.inputToken,
      outputToken: response.outputToken,
    }),
  };
}

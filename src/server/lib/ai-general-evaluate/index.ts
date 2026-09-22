import { resumeToMarkdown } from "@johel/resume";
import { runOpenAiEvaluateResponse } from "../openai/responses";
import { buildUsage } from "../ai-evaluate/types";
import type { AiProviderId } from "../ai-provider";
import type { GeneratedResume } from "@johel/resume";
import {
  buildGeneralAiEvaluateUserPrompt,
  getGeneralAiEvaluateSystemPrompt,
} from "./prompts";

export type GeneralAiEvaluateRequest = {
  apiKey: string;
  evaluatePrompt: string;
  userInstruction: string;
  platform: string;
  resume: GeneratedResume;
};

export type GeneralAiEvaluateResult = {
  markdown: string;
  usage: {
    inputToken: number;
    outputToken: number;
    input: string;
    output: string;
  };
};

export async function runGeneralAiEvaluate(
  _provider: AiProviderId,
  input: GeneralAiEvaluateRequest,
): Promise<GeneralAiEvaluateResult> {
  const instructions = getGeneralAiEvaluateSystemPrompt(
    "openai",
    input.evaluatePrompt,
  );
  const resumeMarkdown = resumeToMarkdown(input.resume);
  const user = buildGeneralAiEvaluateUserPrompt(
    input.userInstruction,
    input.platform,
    resumeMarkdown,
  );

  const response = await runOpenAiEvaluateResponse(
    input.apiKey,
    instructions,
    user,
  );

  const markdown = response.outputText;
  if (!markdown) {
    throw new Error("OpenAI returned empty Markdown.");
  }

  const usage = buildUsage(`${instructions}\n\n${user}`, markdown, {
    inputToken: response.inputToken,
    outputToken: response.outputToken,
  });

  return { markdown, usage };
}

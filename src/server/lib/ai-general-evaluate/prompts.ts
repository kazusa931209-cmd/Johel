import type { AiProviderId } from "../ai-provider";
import { PROMPT_SECTION_SEPARATOR } from "../prompt-optimize/index";

const EXECUTION_RULES = `- You are an AI assistant that evaluates General Resumes (no Job Description).
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the evaluation criteria and output structure defined in Instructions above.
- The user message is labeled Markdown sections (User instruction, Platform, Resume).
- Score alignment with User instruction and factual grounding in the generation context—not against a Job Description.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Follow the Instructions section above for scoring and feedback layout.`;

export function getGeneralAiEvaluateSystemPrompt(
  _provider: AiProviderId,
  evaluatePrompt: string,
): string {
  return `${evaluatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${OPENAI_PROVIDER_NOTES}`;
}

export function buildGeneralAiEvaluateUserPrompt(
  userInstruction: string,
  platform: string,
  resumeMarkdown: string,
): string {
  const instructionBlock =
    userInstruction.trim() || "(none — evaluate structure and PCE grounding)";
  const platformBlock =
    platform.trim() || "(none — no platform label for this run)";

  return [
    "Evaluate the resume for this General Resume run.",
    `## User instruction\n\n${instructionBlock}`,
    `## Platform\n\n${platformBlock}`,
    `## Resume\n\n${resumeMarkdown.trim()}`,
  ].join("\n\n");
}

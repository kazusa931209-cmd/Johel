import type { AiProviderId } from "./types";
import {
  formatJobContextBlock,
  PROMPT_SECTION_SEPARATOR,
} from "../prompt-optimize/index";

const EXECUTION_RULES = `- You are an AI assistant that evaluates resumes against job descriptions.
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the evaluation criteria and output structure defined in Instructions above.
- The user message is labeled Markdown sections (Job context, then Resume).
- If Job context includes Verdict Markdown headings (Role, Technical Requirements, Final Verdict, and similar), use those as the scoring rubric. Otherwise derive the same dimensions from the job text.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Follow the Instructions section above for scoring and feedback layout.`;

export function getAiEvaluateSystemPrompt(
  _provider: AiProviderId,
  evaluatePrompt: string,
): string {
  return `${evaluatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${OPENAI_PROVIDER_NOTES}`;
}

export function buildAiEvaluateUserPrompt(
  jobContext: string,
  resumeMarkdown: string,
): string {
  return [
    "Evaluate the resume against the Job context section. Use Verdict headings when present; otherwise derive the same dimensions from the job text.",
    formatJobContextBlock(jobContext),
    `## Resume\n\n${resumeMarkdown.trim()}`,
  ].join("\n\n");
}

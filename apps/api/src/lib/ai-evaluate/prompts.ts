import type { AiProviderId } from "./types.js";
import {
  formatJobContextBlock,
  PROMPT_SECTION_SEPARATOR,
} from "../prompt-optimize/index.js";

const EXECUTION_RULES = `- You are an AI assistant that evaluates résumés against job descriptions.
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the evaluation criteria and output structure defined in Instructions above.
- The user message is labeled Markdown sections (Job context, then Resume).
- If Job context includes Verdict Markdown headings (Role, Technical Requirements, Final Verdict, and similar), use those as the scoring rubric. Otherwise derive the same dimensions from the job text.`;

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- Follow the Instructions section above for scoring and feedback layout.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Follow the Instructions section above for scoring and feedback layout.`;

const PROMPTS: Record<AiProviderId, string> = {
  cursor: CURSOR_PROVIDER_NOTES,
  openai: OPENAI_PROVIDER_NOTES,
};

export function getAiEvaluateSystemPrompt(
  provider: AiProviderId,
  evaluatePrompt: string,
): string {
  return `${evaluatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${PROMPTS[provider]}`;
}

export function buildAiEvaluateUserPrompt(
  jobContext: string,
  resumeMarkdown: string,
): string {
  return [
    "Evaluate the résumé against the Job context section. Use Verdict headings when present; otherwise derive the same dimensions from the job text.",
    formatJobContextBlock(jobContext),
    `## Resume\n\n${resumeMarkdown.trim()}`,
  ].join("\n\n");
}

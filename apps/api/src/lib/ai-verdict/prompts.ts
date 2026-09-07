import type { AiProviderId } from "./types.js";
import { PROMPT_SECTION_SEPARATOR } from "../prompt-optimize/compile.js";

const EXECUTION_RULES = `- You are an AI Verdict assistant for a resume-generation system.
- Analyze the Job Description in the user message.
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the structure, questions, and output format defined in Instructions above.
- Do not invent data; write "Not found" when information is missing.
- Preserve technical terms exactly as written.`;

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- Follow the Instructions section above for section layout and answer style.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Follow the Instructions section above for section layout and answer style.`;

const PROMPTS: Record<AiProviderId, string> = {
  cursor: CURSOR_PROVIDER_NOTES,
  openai: OPENAI_PROVIDER_NOTES,
};

export function getAiVerdictSystemPrompt(
  provider: AiProviderId,
  verdictPrompt: string,
): string {
  return `${verdictPrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${PROMPTS[provider]}`;
}

export function buildAiVerdictUserPrompt(jobDescription: string): string {
  return `Analyze the following Job Description and produce the required Markdown sections.

---
${jobDescription}
---`;
}

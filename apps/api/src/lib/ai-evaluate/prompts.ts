import type { AiProviderId } from "./types.js";

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- Output Markdown only. Do not wrap the answer in a code fence.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Output Markdown only. Do not wrap the answer in a code fence.`;

const PROMPTS: Record<AiProviderId, string> = {
  cursor: CURSOR_PROVIDER_NOTES,
  openai: OPENAI_PROVIDER_NOTES,
};

export function getAiEvaluateSystemPrompt(
  provider: AiProviderId,
  evaluatePrompt: string,
): string {
  return `${evaluatePrompt.trim()}\n\n${PROMPTS[provider]}`;
}

export function buildAiEvaluateUserPrompt(
  jobDescription: string,
  resumeMarkdown: string,
): string {
  return `Evaluate the resume below against the job description.

Job Description:
---
${jobDescription}
---

Resume:
---
${resumeMarkdown}
---`;
}

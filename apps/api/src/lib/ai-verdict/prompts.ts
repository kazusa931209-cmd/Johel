import type { AiProviderId } from "./types.js";

const SHARED_MARKDOWN_RULES = `You are an AI Verdict assistant for a resume-generation system.

Analyze a pasted Job Description and produce structured Markdown output.

Output MUST be Markdown only. Do NOT output JSON. Do NOT wrap the answer in a code fence.

Use exactly these three top-level sections in this order:

## Verdict

Answer the Verdict instructions above exactly. For each question or bullet from those instructions, output a \`###\` heading with the question text, then the answer directly below it. Use a single paragraph for short answers. Use a bullet list (\`-\`) only when the answer has multiple items (e.g. a list of technologies). Do not use top-level \`-\` bullets for questions in this section. Do not invent answers; use "Not found" when the Job Description does not contain enough information.

## Job

Include job title, salary/currency, location, employment type, work arrangement, skills, responsibilities, requirements, qualifications, benefits, and other job-relevant details when present.

## Job post Company & contacts

Include company name, company description/overview, website, industry, products/services, mission/vision, and contact details when present.

If a field is missing, write "Not found" for that item rather than inventing data.
Preserve technical terms exactly as written.`;

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- In the Verdict section, use \`###\` per question followed by the answer (paragraph or sub-bullet list).
- Prefer concise bullet lists under Job and Company sections.
- Keep the Markdown headings exactly as specified above.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- In the Verdict section, use \`###\` per question followed by the answer (paragraph or sub-bullet list).
- Prefer concise bullet lists under Job and Company sections.
- Keep the Markdown headings exactly as specified above.`;

const PROMPTS: Record<AiProviderId, string> = {
  cursor: CURSOR_PROVIDER_NOTES,
  openai: OPENAI_PROVIDER_NOTES,
};

export function getAiVerdictSystemPrompt(
  provider: AiProviderId,
  verdictPrompt: string,
): string {
  return `${verdictPrompt.trim()}\n\n${SHARED_MARKDOWN_RULES}\n\n${PROMPTS[provider]}`;
}

export function buildAiVerdictUserPrompt(jobDescription: string): string {
  return `Analyze the following Job Description and produce the required Markdown sections.

---
${jobDescription}
---`;
}

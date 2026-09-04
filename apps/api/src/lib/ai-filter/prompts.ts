import type { AiProviderId } from "./types.js";

const SHARED_MARKDOWN_RULES = `You are an AI Filter for a resume-generation system.

Extract structured information from a pasted Job Description.

Output MUST be Markdown only. Do NOT output JSON. Do NOT wrap the answer in a code fence.

Use exactly these two top-level sections:

## Job

Include job title, salary/currency, location, employment type, work arrangement, skills, responsibilities, requirements, qualifications, benefits, and other job-relevant details when present.

## Job post Company & contacts

Include company name, company description/overview, website, industry, products/services, mission/vision, and contact details when present.

If a field is missing, write "Not found" for that item rather than inventing data.
Preserve technical terms exactly as written.`;

const CURSOR_SYSTEM_PROMPT = `${SHARED_MARKDOWN_RULES}

Provider notes (Cursor AI Agent):
- Prefer concise bullet lists under each section.
- Keep the Markdown headings exactly as specified above.`;

const PROMPTS: Record<AiProviderId, string> = {
  cursor: CURSOR_SYSTEM_PROMPT,
};

export function getAiFilterSystemPrompt(provider: AiProviderId): string {
  return PROMPTS[provider];
}

export function buildAiFilterUserPrompt(jobDescription: string): string {
  return `Filter and extract Job and Job post Company & contacts from the following Job Description.

---
${jobDescription}
---`;
}

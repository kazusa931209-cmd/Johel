import type { ResumeGenerationInput } from "./types.js";
import type { AiProviderId } from "../ai-provider.js";
import { PROMPT_SECTION_SEPARATOR } from "../prompt-optimize/compile.js";

const JSON_SCHEMA_DESCRIPTION = `{
  "header": {
    "name": "string (required)",
    "title": "string (optional)",
    "contact": {
      "email": "string (optional)",
      "phone": "string (optional)",
      "location": "string (optional)",
      "website": "string (optional)",
      "linkedin": "string (optional)",
      "github": "string (optional)"
    }
  },
  "summary": "string (optional)",
  "experiences": [{
    "company": "string (required)",
    "title": "string (required)",
    "location": "string (optional)",
    "startDate": "string (optional)",
    "endDate": "string (optional)",
    "bullets": ["string (required, min 1)"]
  }],
  "skills": [{ "category": "string", "items": ["string"] }],
  "education": [{
    "institution": "string (required)",
    "degree": "string (optional)",
    "field": "string (optional)",
    "startDate": "string (optional)",
    "endDate": "string (optional)"
  }],
  "certifications": ["string"],
  "projects": [{
    "name": "string (required)",
    "description": "string (optional)",
    "technologies": ["string"],
    "bullets": ["string"]
  }]
}`;

const EXECUTION_RULES = `- You are an AI Resume writer for a resume-generation system.
- Generate a resume targeted to the supplied job context and input data.
- Job context is AI Verdict Markdown when the client ran Verdict; otherwise it is the noise-filtered job description text.
- Use the full jobContext as the scoring rubric. Do not require specific heading names. If Instructions mention headings that are absent, use the closest sections present (for example Role ≈ title, Technical Requirements ≈ skills).
- Follow the tailoring rules and output expectations defined in Instructions above.
- Do not invent employers, dates, skills, or experience not present in the supplied input data.
- Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA_DESCRIPTION}`;

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- experiences must contain at least one item with at least one bullet each.
- header.name is required.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- experiences must contain at least one item with at least one bullet each.
- header.name is required.
- Return ONLY valid JSON. Do NOT wrap the answer in a code fence.`;

export function extractMarkdownHeadings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) =>
    match[1].trim(),
  );
}

export function getAiResumeSystemPrompt(
  provider: AiProviderId,
  generatePrompt: string,
): string {
  const notes =
    provider === "cursor" ? CURSOR_PROVIDER_NOTES : OPENAI_PROVIDER_NOTES;
  return `${generatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${notes}`;
}

export function buildAiResumeUserPrompt(input: ResumeGenerationInput): string {
  const headings = extractMarkdownHeadings(input.jobContext);
  const headingNote =
    headings.length > 0
      ? `Job context Markdown headings (use these as the scoring rubric; if Instructions name headings that are absent, use the closest match):\n${headings
          .map((heading) => `- ${heading}`)
          .join("\n")}\n\n`
      : "";
  return `${headingNote}Generate a tailored resume from the following input JSON.

---
${JSON.stringify(input, null, 2)}
---`;
}

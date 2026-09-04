import type { ResumeGenerationInput } from "./types.js";
import type { AiProviderId } from "../ai-provider.js";

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
  "skills": [{ "category": "string", "items": ["string"] }],
  "experiences": [{
    "company": "string (required)",
    "title": "string (required)",
    "location": "string (optional)",
    "startDate": "string (optional)",
    "endDate": "string (optional)",
    "bullets": ["string (required, min 1)"]
  }],
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

const SHARED_RULES = `You are an AI Resume writer for a resume-generation system.

Generate a resume specifically targeted to the supplied Job Description and job analysis.

Rules:
- Use ONLY the supplied profile, companies, experiences, and workflow data.
- Never invent employment history, technologies, achievements, dates, education, certifications, or metrics.
- Perform selection, prioritization, and rewriting of existing experience to match the target role.
- Use strong, concise, professional resume language.
- Omit information that does not support the target role.
- Incorporate relevant Job Description terminology only when supported by the user's actual experience.
- Keep the resume ATS-friendly.
- Output language must follow the workflow language code supplied in the input.
- Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA_DESCRIPTION}`;

const CURSOR_PROVIDER_NOTES = `Provider notes (Cursor AI Agent):
- experiences must contain at least one item with at least one bullet each.
- header.name is required.
- Use workflow metadata rule prompts as additional extraction or emphasis rules when present.`;

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- experiences must contain at least one item with at least one bullet each.
- header.name is required.
- Use workflow metadata rule prompts as additional extraction or emphasis rules when present.
- Return ONLY valid JSON. Do NOT wrap the answer in a code fence.`;

export function getAiResumeSystemPrompt(provider: AiProviderId): string {
  const notes =
    provider === "cursor" ? CURSOR_PROVIDER_NOTES : OPENAI_PROVIDER_NOTES;
  return `${SHARED_RULES}\n\n${notes}`;
}

export function buildAiResumeUserPrompt(input: ResumeGenerationInput): string {
  return `Generate a tailored resume from the following input JSON.

---
${JSON.stringify(input, null, 2)}
---`;
}

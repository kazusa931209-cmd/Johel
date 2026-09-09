import type { ResumeGenerationInput } from "./types.js";
import type { AiProviderId } from "../ai-provider.js";
import {
  formatJobContextBlock,
  PROMPT_SECTION_SEPARATOR,
} from "../prompt-optimize/index.js";

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
- The user message is labeled Markdown sections (Job context, Run intent, Profile, Companies). Use Job context as the scoring rubric. Do not require specific heading names. If Instructions mention headings that are absent, use the closest sections present (for example Role ≈ title, Technical Requirements ≈ skills). If Instructions name JSON-style fields (for example companies[].roleContext), they refer to the matching labeled subsections.
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

export function getAiResumeSystemPrompt(
  provider: AiProviderId,
  generatePrompt: string,
): string {
  const notes =
    provider === "cursor" ? CURSOR_PROVIDER_NOTES : OPENAI_PROVIDER_NOTES;
  return `${generatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${notes}`;
}

function optionalLine(label: string, value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return `- ${label}: ${trimmed}`;
}

function formatProfileSection(input: ResumeGenerationInput): string {
  const { profile } = input;
  const lines = [
    `- Name: ${profile.firstName} ${profile.lastName}`.trim(),
    optionalLine("Email", profile.email),
    optionalLine("Phone", profile.pn),
    optionalLine("Residence", profile.residence),
    optionalLine("Birth date", profile.birthDate),
  ].filter((line): line is string => Boolean(line));

  const educationLines = [
    optionalLine("University", profile.university),
    profile.graduationYear != null
      ? `- Graduation year: ${profile.graduationYear}`
      : null,
    optionalLine("Degree", profile.degree),
  ].filter((line): line is string => Boolean(line));
  const linkLines = profile.links
    .filter((link) => link.link?.trim())
    .map((link) => `- ${link.key}: ${link.link?.trim()}`);

  const blocks = [`## Profile`, lines.join("\n")];
  if (educationLines.length > 0) {
    blocks.push(`Education:\n${educationLines.join("\n")}`);
  }
  if (linkLines.length > 0) {
    blocks.push(`Links:\n${linkLines.join("\n")}`);
  }
  return blocks.join("\n\n");
}

function formatCompaniesSection(input: ResumeGenerationInput): string {
  const blocks = input.companies.map((company, index) => {
    const experienceBlocks = company.experiences.map((experience) => {
      const parts = [
        `#### ${experience.category}`,
        `Problem:\n${experience.problem.trim()}`,
        `Actions:\n${experience.actions.trim()}`,
        `Outcome:\n${experience.outcome.trim()}`,
      ];
      return parts.join("\n\n");
    });

    return [
      `### ${index + 1}. ${company.name} (${company.startDate} – ${company.endDate})`,
      `Role context: ${company.roleContext.trim()}`,
      `What this company is:\n${company.whatCompanyIs.trim()}`,
      `Domain & stack:\n${company.domainAndStack.trim()}`,
      `Linked experiences:\n\n${experienceBlocks.join("\n\n")}`,
    ].join("\n\n");
  });

  return `## Companies (resume order)\n\n${blocks.join("\n\n")}`;
}

export function buildAiResumeUserPrompt(input: ResumeGenerationInput): string {
  const emphasis = input.run.emphasis.trim();
  const runIntent = [
    "## Run intent",
    `- Language: ${input.run.language}`,
    emphasis ? `Run guidance:\n${emphasis}` : "Run guidance: (none)",
  ].join("\n");

  return [
    "Generate a tailored resume from the labeled sections below. Use Job context as the scoring rubric. Keep company order. Use each company name as the employer; do not use alias.",
    formatJobContextBlock(input.jobContext),
    runIntent,
    formatProfileSection(input),
    formatCompaniesSection(input),
  ].join("\n\n");
}

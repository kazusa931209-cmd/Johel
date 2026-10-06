import { RESUME_JSON_SCHEMA_DESCRIPTION } from "../ai-resume/prompts";
import type { DraftRefineExperienceMaterial, DraftRefineInput } from "./types";

const EXECUTION_RULES = `- You refine an existing resume draft JSON. Apply the user's instructions and any supplied experience materials.
- Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.
- Do not invent employers, dates, tools, metrics, or jobs unsupported by the current draft or supplied materials.
- Output language must follow the requested resume language.

Required JSON schema:
${RESUME_JSON_SCHEMA_DESCRIPTION}`;

export function getDraftRefineSystemPrompt(compiledUserPrompt: string): string {
  return `${compiledUserPrompt.trim()}

${EXECUTION_RULES}`;
}

function formatExperienceBlock(experience: DraftRefineExperienceMaterial): string {
  return `### ${experience.category} [${experience.id}]
Problem:
${experience.problem.trim()}

Actions:
${experience.actions.trim()}

Outcome:
${experience.outcome.trim()}`;
}

export function buildDraftRefineUserPrompt(input: DraftRefineInput): string {
  const sections: string[] = [
    `## Resume language\n${input.language}`,
    `## Current draft (JSON)\n${JSON.stringify(input.resume, null, 2)}`,
  ];

  if (input.instruction?.trim()) {
    sections.push(`## User instruction\n${input.instruction.trim()}`);
  }

  if (input.company) {
    sections.push(
      `## Company scene (context only)\nAlias: ${input.company.alias}\nName: ${input.company.name}\nWhat this company is:\n${input.company.whatCompanyIs.trim()}`,
    );
  }

  if (input.experiences && input.experiences.length > 0) {
    sections.push(
      `## Experience materials\n${input.experiences.map(formatExperienceBlock).join("\n\n")}`,
    );
  }

  return sections.join("\n\n");
}

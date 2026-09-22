import type { ResumeGenerationInput } from "../ai-resume/types";
import type { AiProviderId } from "../ai-provider";
import {
  buildCompanyTierContext,
  getCompanySceneGenerateRules,
  getDimensionModePromptText,
  getExperienceDimensionModeLabel,
} from "../resume-generation-policy";
import {
  formatProfileSection,
  RESUME_JSON_SCHEMA_DESCRIPTION,
} from "../ai-resume/prompts";
import { PROMPT_SECTION_SEPARATOR } from "../prompt-optimize/index";

function buildGeneralExecutionRules(): string {
  return `- You are an AI Resume writer for a General Resume run (no Job Description).
- Generate a resume from the labeled user message sections only.
- Follow User instruction and Platform (when provided) as the primary creative direction when compatible with factual grounding in Profile, Companies, and linked experience cards.
- The user message is labeled Markdown sections (User instruction, Platform, Run intent, Profile, Companies). Do not invent employers, dates, skills, or experience not present in the supplied input data.
- The summary's first sentence MUST open with "+{N} years of experience" (or the equivalent in run.language), where N is the total derived from the sum of each supplied company employment period (startDate–endDate).
- Do not write meta job-search language in the summary (for example "seeking", "applying for", or "open to"). Show fit through expertise and concrete proofs.
- Keep bullets card-scoped: do not merge technologies or metrics from different linked experience cards into one bullet.
- Each quantified before→after outcome may appear only once across the entire resume.
- Selection-order weight on Experience bullets decreases by the configured decay percent per company (first selected company = full weight).
${getCompanySceneGenerateRules()}
- When Keyword context is provided for a company, use it to steer bullet emphasis for that employer within its selection-order weight.
- Build Skills with 12–20 grounded items (4–5 groups) from linked experience materials.
- Education \`startDate\` and \`endDate\` use graduation year only (for example \`2018\`). Do not include graduation month names or \`YYYY-MM\` values.
- Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${RESUME_JSON_SCHEMA_DESCRIPTION}`;
}

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- experiences must contain at least one item with at least one bullet each.
- header.name is required.
- Return ONLY valid JSON. Do NOT wrap the answer in a code fence.`;

export function getGeneralAiResumeSystemPrompt(
  _provider: AiProviderId,
  generatePrompt: string,
): string {
  return `${generatePrompt.trim()}\n# Execution rules\n\n${buildGeneralExecutionRules()}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${OPENAI_PROVIDER_NOTES}`;
}

function formatKeywordContext(keywordContext?: string): string {
  const trimmed = keywordContext?.trim();
  return trimmed
    ? trimmed
    : "(none — use user instruction and role context)";
}

function formatCompaniesSection(input: ResumeGenerationInput): string {
  const dimensionMode = input.generationPolicy.experienceDimensionMode;
  const dimensionLabel = getExperienceDimensionModeLabel(dimensionMode);
  const dimensionGuidance = getDimensionModePromptText(dimensionMode);

  const decayPercent = input.generationPolicy.experienceJdTierDecayPercent;
  const blocks = input.companies.map((company, index) => {
    const tier = buildCompanyTierContext(index, decayPercent);
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
      `Resume order index: ${tier.resumeOrderIndex} (1 = first selected)`,
      `Selection-order weight: ${tier.jdTierPercent} (Experience bullets only)`,
      `Dimension mode: ${dimensionLabel}`,
      `Role context: ${company.roleContext.trim()}`,
      `Keyword context: ${formatKeywordContext(company.keywordContext)}`,
      `What this company is:\n${company.whatCompanyIs.trim()}`,
      `Linked experiences:\n\n${experienceBlocks.join("\n\n")}`,
    ].join("\n\n");
  });

  return [
    "## Companies (resume order)",
    `Cross-company dimension (${dimensionLabel}): ${dimensionGuidance}`,
    blocks.join("\n\n"),
  ].join("\n\n");
}

function formatUserInstructionBlock(userInstruction: string): string {
  const trimmed = userInstruction.trim();
  return [
    "## User instruction",
    trimmed || "(none — use Platform and PCE materials only)",
  ].join("\n\n");
}

function formatPlatformBlock(platform: string): string {
  const trimmed = platform.trim();
  return [
    "## Platform",
    trimmed || "(none — no platform label for this run)",
  ].join("\n\n");
}

export function buildGeneralAiResumeUserPrompt(
  input: ResumeGenerationInput,
): string {
  const emphasis = input.run.emphasis.trim();
  const userInstruction = input.run.userInstruction?.trim() ?? "";
  const platform = input.run.platform?.trim() ?? "";

  const runIntent = [
    "## Run intent",
    `- Language: ${input.run.language}`,
    emphasis ? `Run guidance:\n${emphasis}` : "Run guidance: (none)",
  ].join("\n");

  return [
    "Generate a General Resume from the labeled sections below. Keep company order. Use each company name as the employer; do not use alias.",
    formatUserInstructionBlock(userInstruction),
    formatPlatformBlock(platform),
    runIntent,
    formatProfileSection(input),
    formatCompaniesSection(input),
  ].join("\n\n");
}

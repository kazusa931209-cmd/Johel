import type { AiProviderId } from "../ai-provider";
import { PROMPT_SECTION_SEPARATOR } from "../prompt-optimize/index";

export type GeneralEvaluateUiLocale = "en" | "ko";

const EXECUTION_RULES = `- You are an AI assistant that evaluates General Resumes (no Job Description).
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the evaluation criteria and output structure defined in Instructions above.
- The user message is labeled Markdown sections (Response language, User prompt when provided, then Resume).
- Obey the **Response language** section in the user message for the language of your entire answer.
- Score and critique the resume text only—do not invent job requirements or employers.`;

function uiLocaleLabel(locale: GeneralEvaluateUiLocale): string {
  return locale === "ko" ? "Korean" : "English";
}

export function buildGeneralEvaluateResponseLanguageSection(
  userPrompt: string,
  uiLocale: GeneralEvaluateUiLocale,
): string {
  const trimmed = userPrompt.trim();
  if (trimmed) {
    return [
      "## Response language",
      "",
      "Write the entire evaluation in the same language as the **User prompt** section below (infer from the user's text).",
      'If the User prompt explicitly requests another output language (e.g. "answer in English", "한국어로 답변해 주세요"), use that language instead.',
    ].join("\n");
  }
  const label = uiLocaleLabel(uiLocale);
  return [
    "## Response language",
    "",
    `Write the entire evaluation in ${label}. The user did not add a custom prompt for this evaluation (UI locale).`,
  ].join("\n");
}

const OPENAI_PROVIDER_NOTES = `Provider notes (OpenAI):
- Follow the Instructions section above for scoring and feedback layout.`;

export function getGeneralAiEvaluateSystemPrompt(
  _provider: AiProviderId,
  evaluatePrompt: string,
): string {
  return `${evaluatePrompt.trim()}\n# Execution rules\n\n${EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${OPENAI_PROVIDER_NOTES}`;
}

const USER_PROMPT_ONLY_EXECUTION_RULES = `- You are an AI assistant that evaluates General Resumes (no Job Description).
- Output Markdown only. Do not output JSON. Do not wrap the answer in a code fence.
- Follow the evaluation criteria and focus in the **User prompt** section of the user message.
- The user message is labeled Markdown sections (Response language, User prompt, then Resume).
- Obey the **Response language** section in the user message for the language of your entire answer.
- Score and critique the resume text only—do not invent job requirements or employers.`;

export function getGeneralAiEvaluateUserPromptOnlySystemPrompt(
  _provider: AiProviderId,
): string {
  return `# Execution rules\n\n${USER_PROMPT_ONLY_EXECUTION_RULES}\n\n${PROMPT_SECTION_SEPARATOR}\n\n${OPENAI_PROVIDER_NOTES}`;
}

export function buildGeneralAiEvaluateUserPrompt(
  userPrompt: string,
  resumeMarkdown: string,
  uiLocale: GeneralEvaluateUiLocale,
): string {
  const blocks = ["Evaluate the resume for this General Resume run."];
  blocks.push(buildGeneralEvaluateResponseLanguageSection(userPrompt, uiLocale));
  const trimmedPrompt = userPrompt.trim();
  if (trimmedPrompt) {
    blocks.push(`## User prompt\n\n${trimmedPrompt}`);
  }
  blocks.push(`## Resume\n\n${resumeMarkdown.trim()}`);
  return blocks.join("\n\n");
}

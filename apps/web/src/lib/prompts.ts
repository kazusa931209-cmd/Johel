export {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_PROMPTS,
  DEFAULT_VERDICT_PROMPT,
} from "@johel/prompt-defaults";

import type { TranslateParams } from "@/messages/translate";

export type PromptTranslateFn = (key: string, params?: TranslateParams) => string;

export function getSystemPromptQualityNotice(t: PromptTranslateFn) {
  return t("guidance.systemPromptQualityNotice");
}

export function getVerdictPromptPlaceholder(t: PromptTranslateFn) {
  return t("guidance.verdictPromptPlaceholder");
}

export function getVerdictPromptResumeHint(t: PromptTranslateFn) {
  return t("guidance.verdictPromptResumeHint");
}

export function getGeneratePromptPlaceholder(t: PromptTranslateFn) {
  return t("guidance.generatePromptPlaceholder");
}

export function getGeneratePromptJobContextHint(t: PromptTranslateFn) {
  return t("guidance.generatePromptJobContextHint");
}

export function getEvaluatePromptPlaceholder(t: PromptTranslateFn) {
  return t("guidance.evaluatePromptPlaceholder");
}

export function getEvaluatePromptJobHint(t: PromptTranslateFn) {
  return t("guidance.evaluatePromptJobHint");
}

export function getAutoMarkdownFormatHint(t: PromptTranslateFn) {
  return t("guidance.autoMarkdownFormat");
}

export function getPromptFieldLabel(t: PromptTranslateFn, kind: "verdict" | "generate" | "evaluate") {
  return t(`settings.prompts.fields.${kind}Prompt`);
}

export function getPromptEditLabel(t: PromptTranslateFn, kind: "verdict" | "generate" | "evaluate") {
  return t(`settings.prompts.edit.${kind}`);
}

export function getPromptTabLabel(t: PromptTranslateFn, kind: "verdict" | "generate" | "evaluate") {
  return t(`settings.prompts.tabs.${kind}`);
}

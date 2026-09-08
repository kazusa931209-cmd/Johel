import type { Locale } from "@/lib/locale";
import { translate } from "@/messages/translate";

const AI_PROVIDER_KEYS: Record<string, string> = {
  cursor: "aiUsage.providers.cursor",
  openai: "aiUsage.providers.openai",
};

const GENERATE_TYPE_KEYS: Record<string, string> = {
  verdict: "aiUsage.generateTypes.verdict",
  generate: "aiUsage.generateTypes.generate",
  evaluate: "aiUsage.generateTypes.evaluate",
  workflowRecommend: "aiUsage.generateTypes.workflowRecommend",
  authorAdvise: "aiUsage.generateTypes.authorAdvise",
  combineRecommend: "aiUsage.generateTypes.combineRecommend",
  promptHelper: "aiUsage.generateTypes.promptHelper",
  markdownFormat: "aiUsage.generateTypes.markdownFormat",
};

export function formatAiProvider(aiProvider: string, locale: Locale = "en"): string {
  const key = AI_PROVIDER_KEYS[aiProvider];
  if (!key) return aiProvider;
  const label = translate(locale, key);
  return label !== key ? label : aiProvider;
}

export function formatGenerateType(generateType: string, locale: Locale = "en"): string {
  const key = GENERATE_TYPE_KEYS[generateType];
  if (!key) return generateType;
  const label = translate(locale, key);
  return label !== key ? label : generateType;
}

export function formatAiUsageDate(iso: string, locale?: Locale): string {
  return new Date(iso).toLocaleString(locale);
}

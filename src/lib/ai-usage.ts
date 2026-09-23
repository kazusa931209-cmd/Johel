import type { Locale } from "@/lib/locale";
import { translate } from "@/messages/translate";

const AI_PROVIDER_KEYS: Record<string, string> = {
  cursor: "aiUsage.providers.cursor",
  openai: "aiUsage.providers.openai",
};

const GENERATE_TYPE_KEYS: Record<string, string> = {
  verdict: "aiUsage.generateTypes.verdict",
  generate: "aiUsage.generateTypes.generate",
  draftRefine: "aiUsage.generateTypes.draftRefine",
  evaluate: "aiUsage.generateTypes.evaluate",
  workflowRecommend: "aiUsage.generateTypes.workflowRecommend",
  authorAdvise: "aiUsage.generateTypes.authorAdvise",
  experienceAdvise: "aiUsage.generateTypes.experienceAdvise",
  experienceSplit: "aiUsage.generateTypes.experienceSplit",
  combineRecommend: "aiUsage.generateTypes.combineRecommend",
  generalCombineRecommend: "aiUsage.generateTypes.generalCombineRecommend",
  promptHelper: "aiUsage.generateTypes.promptHelper",
  markdownFormat: "aiUsage.generateTypes.markdownFormat",
  embedding: "aiUsage.generateTypes.embedding",
  checkOnExperiences: "aiUsage.generateTypes.checkOnExperiences",
  checkGaps: "aiUsage.generateTypes.checkOnExperiences",
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

export function prettifyJsonForAiUsageDisplay(raw: string): {
  displayText: string;
  isJson: boolean;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { displayText: raw, isJson: false };
  }

  const candidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) {
    candidates.push(fenced[1].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed !== null && typeof parsed === "object") {
        return {
          displayText: JSON.stringify(parsed, null, 2),
          isJson: true,
        };
      }
    } catch {
      // not JSON — try next candidate or fall back to markdown
    }
  }

  return { displayText: raw, isJson: false };
}

export function buildAiUsageGroupKey(group: { generationId: string }): string {
  return `generation:${group.generationId}`;
}

export function sortAiUsageGroupsByLatest<
  T extends { latestCreatedAt: string },
>(groups: readonly T[]): T[] {
  return [...groups].sort(
    (a, b) =>
      new Date(b.latestCreatedAt).getTime() -
      new Date(a.latestCreatedAt).getTime(),
  );
}

export function sortAiUsageItemsByCreatedAt<
  T extends { createdAt: string },
>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

import { isAiProviderId, type AiProviderId } from "../ai-provider.js";
import { prisma } from "../prisma.js";
import { recordAiUsage } from "../record-ai-usage.js";
import { isMarkdownFormatUnchanged } from "./prompts.js";
import { runAiMarkdownFormat } from "./run.js";
import type { MarkdownFormatKind } from "./types.js";

export type FormatMarkdownOnSaveInput = {
  userId: string;
  kind: MarkdownFormatKind;
  submitted: string;
  stored: string | null | undefined;
  maxLen: number;
};

export type FormatMarkdownOnSaveResult = {
  formatted: string;
  skipped: boolean;
};

async function loadUserAiSettings(userId: string): Promise<{
  provider: AiProviderId;
  apiKey: string;
}> {
  const setting = await prisma.setting.findUnique({
    where: { userId },
  });
  if (!setting?.apiKey || !setting.provider) {
    throw new Error(
      "AI Agent is not configured. Save a provider and API key in Settings first.",
    );
  }
  if (!isAiProviderId(setting.provider)) {
    throw new Error(`Unsupported AI provider: ${setting.provider}`);
  }
  return { provider: setting.provider, apiKey: setting.apiKey };
}

export async function formatMarkdownOnSave(
  input: FormatMarkdownOnSaveInput,
): Promise<FormatMarkdownOnSaveResult> {
  const submitted = input.submitted.trim();
  if (isMarkdownFormatUnchanged(submitted, input.stored)) {
    return { formatted: submitted, skipped: true };
  }

  const { provider, apiKey } = await loadUserAiSettings(input.userId);
  const result = await runAiMarkdownFormat(provider, {
    kind: input.kind,
    text: submitted,
    apiKey,
  });

  if (!result.markdown.trim()) {
    throw new Error("Markdown conversion returned empty text.");
  }
  if (result.markdown.length > input.maxLen) {
    throw new Error(
      `Markdown conversion exceeded the maximum length of ${input.maxLen} characters.`,
    );
  }

  await recordAiUsage({
    userId: input.userId,
    aiProvider: provider,
    generateType: "markdownFormat",
    usage: result.usage,
  });

  return { formatted: result.markdown, skipped: false };
}

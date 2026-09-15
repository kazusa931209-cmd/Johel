import { requireUserAiSettings } from "../user-ai-settings.js";
import { recordAiUsage } from "../record-ai-usage.js";
import {
  areExperienceFieldsUnchanged,
  finalizeExperienceFieldsOnSave,
  finalizeFormattedMarkdown,
  isMarkdownFormatUnchanged,
} from "./prompts.js";
import { runAiExperienceFieldsMarkdownFormat } from "./run-experience-fields-format.js";
import { runAiMarkdownFormat } from "./run.js";
import type { MarkdownFormatKind } from "./types.js";

export type FormatExperienceFieldsOnSaveInput = {
  userId: string;
  problem: string;
  actions: string;
  outcome: string;
  stored?: {
    problem?: string | null;
    actions?: string | null;
    outcome?: string | null;
  };
  maxLen?: number;
};

export type FormatExperienceFieldsOnSaveResult = {
  problem: string;
  actions: string;
  outcome: string;
  skipped: boolean;
};

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

function finalizeStoredMarkdown(
  kind: MarkdownFormatKind,
  markdown: string,
): string {
  return finalizeFormattedMarkdown(kind, markdown);
}

export async function formatMarkdownOnSave(
  input: FormatMarkdownOnSaveInput,
): Promise<FormatMarkdownOnSaveResult> {
  const submitted = input.submitted.trim();
  if (isMarkdownFormatUnchanged(submitted, input.stored)) {
    return {
      formatted: finalizeStoredMarkdown(input.kind, submitted),
      skipped: true,
    };
  }

  const { provider, apiKey } = await requireUserAiSettings(input.userId);
  const result = await runAiMarkdownFormat(provider, {
    kind: input.kind,
    text: submitted,
    apiKey,
  });

  const formatted = finalizeStoredMarkdown(input.kind, result.markdown);

  if (!formatted.trim()) {
    throw new Error("Markdown conversion returned empty text.");
  }
  if (formatted.length > input.maxLen) {
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

  return { formatted, skipped: false };
}

export async function formatExperienceFieldsOnSave(
  input: FormatExperienceFieldsOnSaveInput,
): Promise<FormatExperienceFieldsOnSaveResult> {
  const maxLen = input.maxLen ?? 20_000;
  const problem = input.problem.trim();
  const actions = input.actions.trim();
  const outcome = input.outcome.trim();

  if (
    areExperienceFieldsUnchanged({
      problem,
      actions,
      outcome,
      stored: input.stored,
    })
  ) {
    return {
      ...finalizeExperienceFieldsOnSave({ problem, actions, outcome }),
      skipped: true,
    };
  }

  const { provider, apiKey } = await requireUserAiSettings(input.userId);
  const result = await runAiExperienceFieldsMarkdownFormat(provider, {
    problem,
    actions,
    outcome,
    apiKey,
  });

  if (!result.problem.trim() || !result.actions.trim() || !result.outcome.trim()) {
    throw new Error("Markdown conversion returned empty text.");
  }
  if (
    result.problem.length > maxLen ||
    result.actions.length > maxLen ||
    result.outcome.length > maxLen
  ) {
    throw new Error(
      `Markdown conversion exceeded the maximum length of ${maxLen} characters.`,
    );
  }

  await recordAiUsage({
    userId: input.userId,
    aiProvider: provider,
    generateType: "markdownFormat",
    usage: result.usage,
  });

  return {
    problem: result.problem,
    actions: result.actions,
    outcome: result.outcome,
    skipped: false,
  };
}

export type FormatCompanyFieldsOnSaveInput = {
  userId: string;
  whatCompanyIs: string;
  stored?: {
    whatCompanyIs?: string | null;
  };
  maxLen?: number;
};

export type FormatCompanyFieldsOnSaveResult = {
  whatCompanyIs: string;
  skipped: boolean;
};

export async function formatCompanyFieldsOnSave(
  input: FormatCompanyFieldsOnSaveInput,
): Promise<FormatCompanyFieldsOnSaveResult> {
  const result = await formatMarkdownOnSave({
    userId: input.userId,
    kind: "companyWhatItIs",
    submitted: input.whatCompanyIs,
    stored: input.stored?.whatCompanyIs,
    maxLen: input.maxLen ?? 20_000,
  });

  return {
    whatCompanyIs: result.formatted,
    skipped: result.skipped,
  };
}

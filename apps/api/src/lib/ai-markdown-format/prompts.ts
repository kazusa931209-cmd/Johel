import type { MarkdownFormatKind } from "./types.js";

const KIND_LABELS: Record<MarkdownFormatKind, string> = {
  verdict: "Verdict Prompt (used when checking Job Descriptions)",
  generate: "Generate Prompt (used when generating résumés)",
  evaluate: "Evaluate Prompt (used when evaluating résumés)",
  companyDescription:
    "Company description (used when generating résumés from workflow data)",
  experienceDescription:
    "Experience description (used when generating résumés from workflow data)",
};

const SYSTEM_MESSAGE = `You convert user-authored text into clean, well-structured Markdown.

Rules:
- Output ONLY the converted Markdown. No preamble, explanation, or wrapping code fence.
- Preserve the original meaning and facts exactly. Do not invent, remove, or rephrase substantive content.
- Use headings, lists, and paragraphs where they improve structure.
- If the input contains "## New" helper blocks, fold their sentences into the document structure (do not leave a literal "## New" heading unless it is meaningful section structure).
- Keep the tone and intent of the original text.`;

export function getMarkdownFormatSystemMessage(): string {
  return SYSTEM_MESSAGE;
}

export function buildMarkdownFormatUserMessage(input: {
  kind: MarkdownFormatKind;
  text: string;
}): string {
  const kindLabel = KIND_LABELS[input.kind];

  return `Field type: ${kindLabel}

Text to convert to Markdown:
---
${input.text.trim()}
---

Convert the text above to clean Markdown. Output only the Markdown.`;
}

export function normalizeFormattedMarkdown(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  const fullFence = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  if (fullFence) {
    text = fullFence[1].trim();
  }

  return text;
}

export function validateFormattedMarkdown(
  markdown: string,
  maxLen: number,
): void {
  if (!markdown.trim()) {
    throw new Error("Markdown conversion returned empty text.");
  }
  if (markdown.length > maxLen) {
    throw new Error(
      `Markdown conversion exceeded the maximum length of ${maxLen} characters.`,
    );
  }
}

export function isMarkdownFormatUnchanged(
  submitted: string,
  stored: string | null | undefined,
): boolean {
  return submitted.trim() === (stored ?? "").trim();
}

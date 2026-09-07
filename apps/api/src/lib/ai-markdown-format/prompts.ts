import type { MarkdownFormatKind } from "./types.js";

const KIND_LABELS: Record<MarkdownFormatKind, string> = {
  verdict: "Verdict Prompt (used when checking Job Descriptions)",
  generate: "Generate Prompt (used when generating résumés)",
  evaluate: "Evaluate Prompt (used when evaluating résumés)",
  companyWhatItIs:
    "What this company is (used when generating résumés from workflow data)",
  companyDomainAndStack:
    "Domain & stack (used when generating résumés from workflow data)",
  experienceProblem:
    "Experience problem (used when generating résumés from workflow data)",
  experienceActions:
    "Experience actions (used when generating résumés from workflow data)",
  experienceOutcome:
    "Experience outcome (used when generating résumés from workflow data)",
};

const PROMPT_INSTRUCTION_KINDS = new Set<MarkdownFormatKind>([
  "verdict",
  "generate",
  "evaluate",
]);

const PROMPT_HEADING_RULES = `- Use ## as the largest heading. Never use # (h1).
- Use ### and below for subsections.
- Preserve the author's section intent; do not invent new sections.`;

const SYSTEM_MESSAGE = `You convert user-authored text into clean, well-structured Markdown.

Rules:
- Output ONLY the converted Markdown. No preamble, explanation, or wrapping code fence.
- Preserve the original meaning and facts exactly. Do not invent, remove, or rephrase substantive content.
- Use headings, lists, and paragraphs where they improve structure.
- If the input contains "## New" helper blocks, fold their sentences into the document structure (do not leave a literal "## New" heading unless it is meaningful section structure).
- Keep the tone and intent of the original text.`;

export function isPromptInstructionKind(
  kind: MarkdownFormatKind,
): kind is "verdict" | "generate" | "evaluate" {
  return PROMPT_INSTRUCTION_KINDS.has(kind);
}

export function capPromptHeadings(markdown: string): string {
  return markdown.replace(/^# (?!#)/gm, "## ");
}

export function getMarkdownFormatSystemMessage(): string {
  return SYSTEM_MESSAGE;
}

export function buildMarkdownFormatUserMessage(input: {
  kind: MarkdownFormatKind;
  text: string;
}): string {
  const kindLabel = KIND_LABELS[input.kind];
  const headingRules = isPromptInstructionKind(input.kind)
    ? `\n\nAdditional rules for this field:\n${PROMPT_HEADING_RULES}`
    : "";

  return `Field type: ${kindLabel}

Text to convert to Markdown:
---
${input.text.trim()}
---${headingRules}

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

export function finalizeFormattedMarkdown(
  kind: MarkdownFormatKind,
  raw: string,
): string {
  let text = normalizeFormattedMarkdown(raw);
  if (isPromptInstructionKind(kind)) {
    text = capPromptHeadings(text);
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

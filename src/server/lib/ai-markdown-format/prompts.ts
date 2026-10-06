import { z } from "zod";
import type { MarkdownFormatKind } from "./types";

const KIND_LABELS: Record<MarkdownFormatKind, string> = {
  verdict: "Verdict Prompt (used when checking Job Descriptions)",
  generate: "Generate Prompt (used when generating resumes)",
  evaluate: "Evaluate Prompt (used when evaluating resumes)",
  refine: "Refine Prompt (used when refining draft resumes on the Generate step)",
  companyWhatItIs:
    "What this company is (used when generating resumes from workflow data)",
  experienceProblem:
    "Experience problem (used when generating resumes from workflow data)",
  experienceActions:
    "Experience actions (used when generating resumes from workflow data)",
  experienceOutcome:
    "Experience outcome (used when generating resumes from workflow data)",
};

const PROMPT_INSTRUCTION_KINDS = new Set<MarkdownFormatKind>([
  "verdict",
  "generate",
  "evaluate",
  "refine",
]);

const STRUCTURED_LIST_KINDS = new Set<MarkdownFormatKind>([
  "experienceProblem",
  "experienceActions",
  "experienceOutcome",
]);

const PROMPT_HEADING_RULES = `- Use ## as the largest heading. Never use # (h1).
- Use ### and below for subsections.
- Preserve the author's section intent; do not invent new sections.`;

const STRUCTURED_LIST_RULES = `- Do NOT add document titles, # headings, or field-type metadata.
- Do NOT repeat the experience category as a heading (category is stored separately).
- Format each distinct item as a bullet with a bold label and an indented body on the next line:
  - **Label**
    Description text continues here, indented with two spaces.
- For a single plain sentence, use one bullet; derive a short bold label from the content when none is given.
- Example:
  - **0→1 Product Development**
    Took end-to-end ownership of products from initial requirements and architecture through implementation, production deployment, and ongoing operations.
- Preserve all factual content from the input. Do not invent metrics or details.`;

const SYSTEM_MESSAGE = `You convert user-authored text into clean, well-structured Markdown.

Rules:
- Output ONLY the converted Markdown. No preamble, explanation, or wrapping code fence.
- Preserve the original meaning and facts exactly. Do not invent, remove, or rephrase substantive content.
- Use headings, lists, and paragraphs where they improve structure.
- If the input contains "## New" helper blocks, fold their sentences into the document structure (do not leave a literal "## New" heading unless it is meaningful section structure).
- Keep the tone and intent of the original text.`;

export function isPromptInstructionKind(
  kind: MarkdownFormatKind,
): kind is "verdict" | "generate" | "evaluate" | "refine" {
  return PROMPT_INSTRUCTION_KINDS.has(kind);
}

export function isStructuredListKind(
  kind: MarkdownFormatKind,
): kind is
  | "experienceProblem"
  | "experienceActions"
  | "experienceOutcome" {
  return STRUCTURED_LIST_KINDS.has(kind);
}

function stripStructuredListArtifacts(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^#{1,6}\s/.test(trimmed)) return false;
      if (/^\*\*Field type:\*\*/i.test(trimmed)) return false;
      if (/^Field type:/i.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/^\n+/, "")
    .trim();
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
  const additionalRules = isPromptInstructionKind(input.kind)
    ? `\n\nAdditional rules:\n${PROMPT_HEADING_RULES}`
    : isStructuredListKind(input.kind)
      ? `\n\nAdditional rules:\n${STRUCTURED_LIST_RULES}`
      : "";

  return `Convert the text below to clean Markdown. Output only the Markdown.

Context (do NOT include in output): ${kindLabel}

Text:
---
${input.text.trim()}
---${additionalRules}`;
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
  if (isStructuredListKind(kind)) {
    text = stripStructuredListArtifacts(text);
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

export function areExperienceFieldsUnchanged(input: {
  problem: string;
  actions: string;
  outcome: string;
  stored?: {
    problem?: string | null;
    actions?: string | null;
    outcome?: string | null;
  };
}): boolean {
  return (
    isMarkdownFormatUnchanged(input.problem, input.stored?.problem) &&
    isMarkdownFormatUnchanged(input.actions, input.stored?.actions) &&
    isMarkdownFormatUnchanged(input.outcome, input.stored?.outcome)
  );
}

export function getExperienceFieldsFormatSystemMessage(): string {
  return `${SYSTEM_MESSAGE}

For this task, format three Experience STAR fields (problem, actions, outcome) as separate Markdown values.

Output ONLY valid JSON with exactly these keys: "problem", "actions", "outcome".
Each value must contain only the converted Markdown for that field (no code fences, no extra keys).

Additional rules (apply to every field):
${STRUCTURED_LIST_RULES}`;
}

export function buildExperienceFieldsFormatUserMessage(input: {
  problem: string;
  actions: string;
  outcome: string;
}): string {
  return `Convert each field below to clean Markdown. Output JSON only.

Problem:
---
${input.problem.trim()}
---

Actions:
---
${input.actions.trim()}
---

Outcome:
---
${input.outcome.trim()}
---`;
}

const experienceFieldsResponseSchema = z.object({
  problem: z.string(),
  actions: z.string(),
  outcome: z.string(),
});

export function parseExperienceFieldsFormatResponse(
  raw: string,
  maxLen: number,
): { problem: string; actions: string; outcome: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Markdown conversion returned empty text.");
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new Error("Experience field formatting response was not valid JSON.");
  }

  const parsed = experienceFieldsResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(
      "Experience field formatting response did not match the required schema.",
    );
  }

  const problem = finalizeFormattedMarkdown(
    "experienceProblem",
    parsed.data.problem,
  );
  const actions = finalizeFormattedMarkdown(
    "experienceActions",
    parsed.data.actions,
  );
  const outcome = finalizeFormattedMarkdown(
    "experienceOutcome",
    parsed.data.outcome,
  );

  validateFormattedMarkdown(problem, maxLen);
  validateFormattedMarkdown(actions, maxLen);
  validateFormattedMarkdown(outcome, maxLen);

  return { problem, actions, outcome };
}

export function finalizeExperienceFieldsOnSave(input: {
  problem: string;
  actions: string;
  outcome: string;
}): { problem: string; actions: string; outcome: string } {
  return {
    problem: finalizeFormattedMarkdown("experienceProblem", input.problem.trim()),
    actions: finalizeFormattedMarkdown(
      "experienceActions",
      input.actions.trim(),
    ),
    outcome: finalizeFormattedMarkdown("experienceOutcome", input.outcome.trim()),
  };
}


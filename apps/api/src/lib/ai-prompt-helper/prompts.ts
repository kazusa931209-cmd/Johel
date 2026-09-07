import type { PromptHelperKind } from "./types.js";

const KIND_LABELS: Record<PromptHelperKind, string> = {
  verdict: "Verdict Prompt (used when checking Job Descriptions)",
  generate: "Generate Prompt (used when generating résumés)",
  evaluate: "Evaluate Prompt (used when evaluating résumés)",
  companyDescription:
    "Company description (used when generating résumés from workflow data)",
  experienceDescription:
    "Experience description (used when generating résumés from workflow data)",
};

const SYSTEM_MESSAGE = `You help a user write text for a résumé application.

Output ONLY exactly one concise, simple sentence based on the user's request.
Write the sentence from scratch. Do not reference, continue, or depend on any existing field content.
Do not output a second sentence.
Do not wrap the answer in quotes or a code fence.
Do not output a Markdown heading.
Do not add a preamble or explanation.
The sentence must be self-contained and actionable.`;

export function getPromptHelperSystemMessage(): string {
  return SYSTEM_MESSAGE;
}

export function buildPromptHelperUserMessage(input: {
  kind: PromptHelperKind;
  request: string;
}): string {
  const kindLabel = KIND_LABELS[input.kind];

  return `Field type: ${kindLabel}

User request:
---
${input.request.trim()}
---

Write exactly one new sentence from the user request above.`;
}

export function normalizePromptHelperSentence(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();

  const headingMatch = text.match(/^##\s*New\s*\n+/i);
  if (headingMatch) {
    text = text.slice(headingMatch[0].length).trim();
  } else if (/^##\s*New\s+/i.test(text)) {
    text = text.replace(/^##\s*New\s+/i, "").trim();
  }

  return text.replace(/\s+/g, " ").trim();
}

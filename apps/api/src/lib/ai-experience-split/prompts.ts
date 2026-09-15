import { summarizeExperienceProblem } from "../experience-problem-summary.js";
import type {
  ExperienceSplitIndexItem,
  ExperienceSplitRequest,
  ExperienceSplitTarget,
} from "./types.js";

const JSON_SCHEMA = `{
  "rationale": "string (required summary)",
  "questions": ["string"],
  "operations": [
    {
      "placement": "create_experience",
      "rationale": "string (required)",
      "draft": {
        "category": "string (required)",
        "problem": "string (required)",
        "actions": "string (required)",
        "outcome": "string (required)"
      },
      "warnings": ["string"]
    }
  ],
  "warnings": ["string"]
}`;

const SHARED_RULES = `You are an AI Experience split advisor for JoHEL, a resume workspace tool.

Your job: split one dense or mixed capability card into multiple focused STAR capability cards.

Rules:
- Split when bullets describe different failure modes, capabilities, or unrelated outcomes — not when they are the same story told with different stacks only.
- Do not split stack-only variants (e.g. NestJS vs Go for the same capability). Keep those as one card.
- Each result card = one capability unit: category, problem, actions, outcome.
- Target size per result card: Problem 2–4 bullets, Actions 3–6 bullets, Outcome 1–3 bullets.
- Redistribute bullets from the source card only. Do not invent tools, dates, metrics, or employers.
- Never name employers or company aliases in draft fields.
- **category** is a short plain-text capability title only. Never use Markdown, bullets, or multi-line text in category.
- Format **problem**, **actions**, and **outcome** as bullet lists with bold labels and indented bodies.
- Use create_experience operations only. Do not update or reference other pool cards.
- If the card is already focused (one capability, reasonable size), return questions explaining why split is unnecessary and an empty operations array.

Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA}`;

export function getExperienceSplitSystemPrompt(): string {
  return `${SHARED_RULES}\n\nProvider notes (OpenAI): Return ONLY valid JSON. Do NOT wrap the answer in a code fence.`;
}

function formatTargetBlock(target: ExperienceSplitTarget): string {
  return [
    `### ${target.category} (id: ${target.id})`,
    `Problem:\n${target.problem.trim()}`,
    `Actions:\n${target.actions.trim()}`,
    `Outcome:\n${target.outcome.trim()}`,
  ].join("\n\n");
}

function formatPoolIndexBlock(items: ExperienceSplitIndexItem[]): string {
  if (items.length === 0) {
    return "(no other live pool cards)";
  }
  return items
    .map(
      (item) =>
        `- ${item.id}: ${item.category} — ${item.problemSummary}`,
    )
    .join("\n");
}

export function buildExperienceSplitUserPrompt(
  input: ExperienceSplitRequest,
): string {
  return [
    "Split the source experience card below into focused capability cards when warranted.",
    "",
    "## Source card (split this)",
    "",
    formatTargetBlock(input.target),
    "",
    "## Other pool cards (for naming deduplication only — do not update these)",
    "",
    formatPoolIndexBlock(input.poolIndex),
    "",
    "Respond with a JSON object only (schema in instructions). Do not wrap in a code fence.",
  ].join("\n");
}

export function buildPoolIndexFromRows(
  rows: Array<{ id: string; category: string; problem: string }>,
  excludeId: string,
): ExperienceSplitIndexItem[] {
  return rows
    .filter((row) => row.id !== excludeId)
    .map((row) => ({
      id: row.id,
      category: row.category,
      problemSummary: summarizeExperienceProblem(row.problem),
    }));
}

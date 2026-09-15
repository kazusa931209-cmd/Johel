import { formatExperiencePoolForAdvise } from "../ai-experience-advise/prompts.js";
import type { CheckGapsRunInput } from "./types.js";

const JSON_SCHEMA = `{
  "verdict": "gap_confirmed | exists_not_linked | exists_and_linked",
  "matchedExperienceIds": ["string"],
  "explanation": "string"
}`;

export function getCheckGapsSystemPrompt(hasGenerationContext: boolean): string {
  const linkageRules = hasGenerationContext
    ? `- **exists_not_linked** — one or more experience cards cover this gap, but none of the matched ids appear in the linked list for this Generate.
- **exists_and_linked** — at least one matched experience id is already linked to this Generate (not a gap for this run).`
    : `- **exists_not_linked** — one or more experience cards in the workspace cover this gap (use this whenever a match exists; linkage is not evaluated).
- Do **not** return **exists_and_linked** without generation linkage context.`;

  return `You are the JoHEL AI Assistant helping a resume author verify evaluation gaps against their shared Experience pool.

Given a gap description (from resume evaluation or user input) and the ranked experience pool, decide whether the gap is real.

Verdict rules:
- **gap_confirmed** — no experience card meaningfully covers the described gap.
${linkageRules}

Matching guidance:
- Compare capability and scope, not exact wording.
- Only include ids in **matchedExperienceIds** when the card clearly covers the gap.
- Prefer precision over recall; empty **matchedExperienceIds** with **gap_confirmed** when unsure.

Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA}`;
}

export function buildCheckGapsUserPrompt(input: CheckGapsRunInput): string {
  const sections = [
    "Check whether the following gap is covered by any experience in the pool.",
    "",
    formatExperiencePoolForAdvise(
      input.graph,
      input.expandedIds,
      input.indexIds,
    ),
    "",
    "## Gap description",
    "",
    input.gapQuery.trim(),
  ];

  if (input.linkedExperienceIds) {
    const linkedList =
      input.linkedExperienceIds.size > 0
        ? [...input.linkedExperienceIds].join(", ")
        : "(none linked yet)";
    sections.push(
      "",
      "## Linked experience ids for this Generate",
      "",
      linkedList,
    );
  }

  return sections.join("\n");
}

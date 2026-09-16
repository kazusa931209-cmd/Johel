import { formatExperiencePoolForAdvise } from "../ai-experience-advise/prompts.js";
import type { CheckOnExperiencesRunInput } from "./types.js";

const JSON_SCHEMA = `{
  "verdict": "gap_confirmed | exists_not_linked | exists_and_linked",
  "matchedExperienceIds": ["string"],
  "explanation": "string"
}`;

export function getCheckOnExperiencesSystemPrompt(
  hasGenerationContext: boolean,
): string {
  const linkageRules = hasGenerationContext
    ? `- **exists_not_linked** — one or more experience cards cover this search, but none of the matched ids appear in the linked list for this Generate.
- **exists_and_linked** — at least one matched experience id is already linked to this Generate (not a gap for this run).`
    : `- **exists_not_linked** — one or more experience cards in the workspace cover this search (use this whenever a match exists; linkage is not evaluated).
- Do **not** return **exists_and_linked** without generation linkage context.`;

  return `You are the JoHEL AI Assistant helping a resume author search their shared Experience pool.

Given search text (from resume evaluation or user input) and the ranked experience pool, decide whether any experience card covers it.

Verdict rules:
- **gap_confirmed** — no experience card meaningfully covers the search text.
${linkageRules}

Matching guidance:
- Compare capability and scope, not exact wording.
- Only include ids in **matchedExperienceIds** when the card clearly covers the search text.
- Prefer precision over recall; empty **matchedExperienceIds** with **gap_confirmed** when unsure.

Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA}`;
}

export function buildCheckOnExperiencesUserPrompt(
  input: CheckOnExperiencesRunInput,
): string {
  const sections = [
    "Check whether the following search text is covered by any experience in the pool.",
    "",
    formatExperiencePoolForAdvise(
      input.graph,
      input.expandedIds,
      input.indexIds,
    ),
    "",
    "## Search text",
    "",
    input.searchText.trim(),
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

import type { AiProviderId } from "../ai-provider.js";
import { summarizeExperienceProblem } from "../experience-problem-summary.js";
import type {
  ExperienceAdviseGraph,
  ExperienceAdviseGraphExperience,
  ExperienceAdviseRequest,
} from "./types.js";

const JSON_SCHEMA = `{
  "rationale": "string (required summary)",
  "questions": ["string"],
  "operations": [
    {
      "placement": "create_experience | update_experience | need_more_facts",
      "rationale": "string (required)",
      "targetExperienceId": "string | null",
      "draft": {
        "category": "string | null",
        "problem": "string | null",
        "actions": "string | null",
        "outcome": "string | null"
      },
      "warnings": ["string"]
    }
  ]
}`;

const SHARED_RULES = `You are an AI Experience authoring advisor for JoHEL, a resume workspace tool.

Your job: given the user's Experience pool and what they actually did, produce one or more operations that create or update STAR capability cards.

When an edit target is set, that card is shown with full STAR text; other cards appear as a compact index (id, category, problem summary) for duplicate detection and choosing a different update target only.

Authoring rules (must follow):
- Experience holds one capability unit (STAR): category, problem, actions, outcome. One card = one capability (one problem solved), not one technology.
- Do not split the same capability into separate cards by stack only (e.g. PostgreSQL card + NestJS card). Prefer update_experience on the existing card or one create_experience with combined actions.
- Experience draft fields describe the capability only. Never name employers, company aliases, or employer-specific framing in draft fields.
- Do not put JD routing instructions in Actions ("use when the JD asks for X").
- Do not invent tools, dates, or metrics the user did not state.
- **category** is a short plain-text capability title only (e.g. "Multi-tenant Retail APIs" or "On-chain Transaction Sync (Go/Rust)"). Never use Markdown, bullets, bold labels, prefixes like "Capability:", or multi-line text in category.
- Format **problem**, **actions**, and **outcome** as bullet lists with bold labels and indented bodies when appropriate. Do not apply that format to category.
- If facts are insufficient, return operations with a single need_more_facts placement and questions; leave draft fields null.

Placement guide:
- create_experience: new STAR card when no existing card matches the capability. Return full category, problem, actions, and outcome in draft.
- update_experience: add to an existing card (targetExperienceId). Return only new bullets to add in each changed field; set unchanged fields to null. Do not repeat existing bullets from the graph verbatim. If the user explicitly asks to rewrite existing wording, return the full replacement text for that field only.
- need_more_facts: when you cannot honestly draft STAR content. Include questions; empty or null draft.

When targetExperienceId is set on the request graph, default to update_experience on that card unless the user's facts clearly describe a different capability.

Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.

Required JSON schema:
${JSON_SCHEMA}`;

export function getExperienceAdviseSystemPrompt(provider: AiProviderId): string {
  const notes =
    provider === "cursor"
      ? "Provider notes (Cursor AI Agent): Return ONLY valid JSON."
      : "Provider notes (OpenAI): Return ONLY valid JSON. Do NOT wrap the answer in a code fence.";
  return `${SHARED_RULES}\n\n${notes}`;
}

function formatExperienceFullBlock(
  experience: ExperienceAdviseGraphExperience,
): string {
  return [
    `### ${experience.category} (id: ${experience.id})`,
    `Problem:\n${experience.problem.trim()}`,
    `Actions:\n${experience.actions.trim()}`,
    `Outcome:\n${experience.outcome.trim()}`,
  ].join("\n\n");
}

function formatExperienceFullPool(
  experiences: ExperienceAdviseGraphExperience[],
): string {
  if (experiences.length === 0) {
    return "## Experience pool\n\n(none)";
  }

  const blocks = experiences.map((experience) =>
    formatExperienceFullBlock(experience),
  );

  return `## Experience pool\n\n${blocks.join("\n\n")}`;
}

function formatExperienceTieredPool(graph: ExperienceAdviseGraph): string {
  const { experiences, targetExperienceId } = graph;
  if (experiences.length === 0) {
    return "## Experience pool\n\n(none)";
  }

  const target = experiences.find(
    (experience) => experience.id === targetExperienceId,
  );
  const others = experiences.filter(
    (experience) => experience.id !== targetExperienceId,
  );

  const sections: string[] = ["## Experience pool", ""];

  if (target) {
    sections.push("### Edit target (full STAR)", "", formatExperienceFullBlock(target));
  }

  if (others.length > 0) {
    sections.push(
      "",
      "### Other experiences (index — id, category, problem summary only)",
      "",
      ...others.map(
        (experience) =>
          `- ${experience.id}: ${experience.category} — ${summarizeExperienceProblem(experience.problem)}`,
      ),
    );
  }

  return sections.join("\n").trimEnd();
}

export function formatExperiencePoolForAdvise(
  graph: ExperienceAdviseGraph,
): string {
  if (graph.targetExperienceId) {
    return formatExperienceTieredPool(graph);
  }
  return formatExperienceFullPool(graph.experiences);
}

export function buildExperienceAdviseUserPrompt(
  input: ExperienceAdviseRequest,
): string {
  const targetLine = input.graph.targetExperienceId
    ? `Edit target experience id: **${input.graph.targetExperienceId}** (prefer updating this card unless facts describe a different capability).`
    : "Mode: **create** (no target card; choose create or update from the pool).";

  return [
    "Draft Experience STAR cards from the user's facts.",
    targetLine,
    "",
    formatExperiencePoolForAdvise(input.graph),
    "",
    "## User facts",
    "",
    input.userFacts.trim(),
  ].join("\n");
}

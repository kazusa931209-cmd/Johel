import type { AiProviderId } from "../ai-provider.js";
import type {
  WorkflowRecommendRequest,
  WorkflowRecommendSummary,
} from "./types.js";

const JSON_SCHEMA = `{
  "matches": [{
    "workflowId": "string (required; must be one of the supplied workflow ids)",
    "score": "number (required; 0-100 fit score for the job)"
  }]
}`;

const SHARED_RULES = `You are an AI assistant that recommends the best saved workflow preset for a job application.

Rules:
- Score every supplied workflow from 0 to 100 for fit against the job description and optional job analysis.
- Each workflow includes a flat \`experiences\` array with full experience details (\`id\`, \`category\`, \`description\`).
- Each company entry lists \`experienceIds\` that reference entries in that workflow's \`experiences\` array by \`id\` (the same experience may appear under multiple companies).
- Score using profile name, company periods, linked experience categories and descriptions, and language versus the target role.
- Return ONLY valid JSON matching the schema below. Do NOT output Markdown. Do NOT wrap the answer in a code fence.
- Include one match entry per supplied workflow id.

Required JSON schema:
${JSON_SCHEMA}`;

export function getWorkflowRecommendSystemPrompt(provider: AiProviderId): string {
  const notes =
    provider === "cursor"
      ? "Provider notes (Cursor AI Agent): scores must be numbers from 0 to 100."
      : "Provider notes (OpenAI): scores must be numbers from 0 to 100. Return ONLY valid JSON.";
  return `${SHARED_RULES}\n\n${notes}`;
}

export function buildWorkflowRecommendUserPrompt(
  input: Pick<
    WorkflowRecommendRequest,
    "jobDescription" | "acceptedMarkdown" | "workflows"
  >,
): string {
  const payload = {
    jobDescription: input.jobDescription,
    acceptedMarkdown: input.acceptedMarkdown ?? "",
    workflows: input.workflows.map(summarizeWorkflow),
  };

  return `Recommend workflow fit scores from the following input JSON.

---
${JSON.stringify(payload, null, 2)}
---`;
}

function summarizeWorkflow(workflow: WorkflowRecommendSummary) {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    language: workflow.language,
    profileName: workflow.profileName,
    experiences: workflow.experiences,
    companies: workflow.companies,
  };
}

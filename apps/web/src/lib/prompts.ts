export {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_PROMPTS,
  DEFAULT_VERDICT_PROMPT,
} from "@johel/prompt-defaults";

export const VERDICT_PROMPT_PLACEHOLDER =
  "Define Verdict sections (e.g. ## Verdict, ## Job, ## Company & contacts), questions, and answer format.";

export const VERDICT_PROMPT_RESUME_HINT =
  "When Do Verdict is enabled in Settings, this prompt shapes the Markdown that replaces the raw job description during resume generation. Its sections and extracted fields directly affect resume tailoring quality.";

export const GENERATE_PROMPT_PLACEHOLDER =
  "Define resume tailoring rules, selection priorities, language/tone, and output expectations.";

export const GENERATE_PROMPT_JOB_CONTEXT_HINT =
  "Resume generation targets the AI Verdict result when Do Verdict is enabled; otherwise it uses the noise-filtered job description from the Job step.";

export const EVALUATE_PROMPT_PLACEHOLDER =
  "Define evaluation criteria, scoring, and Markdown output structure for ATS feedback.";

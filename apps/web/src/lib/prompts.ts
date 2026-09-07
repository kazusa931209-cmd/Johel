export {
  DEFAULT_EVALUATE_PROMPT,
  DEFAULT_GENERATE_PROMPT,
  DEFAULT_PROMPTS,
  DEFAULT_VERDICT_PROMPT,
} from "@johel/prompt-defaults";

export const VERDICT_PROMPT_PLACEHOLDER =
  "Define Verdict sections (e.g. ## Fit questions, ## Role, ## Technical Requirements, ## Company & Contacts), questions, and answer format.";

export const VERDICT_PROMPT_RESUME_HINT =
  "When Do Verdict is enabled in Settings, this prompt shapes the Markdown that replaces the raw job description during resume generation and evaluation. Its sections and extracted fields directly affect resume tailoring quality.";

export const GENERATE_PROMPT_PLACEHOLDER =
  "Define resume tailoring rules, selection priorities, language/tone, and output expectations.";

export const GENERATE_PROMPT_JOB_CONTEXT_HINT =
  "Resume generation targets the AI Verdict result when Do Verdict is enabled; otherwise it uses the noise-filtered job description from the Job step. The model receives that job context as labeled Markdown, then Workflow intent, Profile, and Companies (not a JSON dump).";

export const EVALUATE_PROMPT_PLACEHOLDER =
  "Define evaluation criteria against Verdict dimensions (Role, Technical Requirements, Final Verdict), scoring, and Markdown output structure.";

export const EVALUATE_PROMPT_JOB_HINT =
  "Resume evaluation uses the same job context as generation: AI Verdict Markdown when Do Verdict is enabled; otherwise the noise-filtered job description. The model receives labeled Job context and Resume Markdown.";

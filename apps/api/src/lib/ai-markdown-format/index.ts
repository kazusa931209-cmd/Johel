export type {
  MarkdownFormatKind,
  MarkdownFormatRequest,
  MarkdownFormatResult,
} from "./types.js";

export {
  isMarkdownFormatUnchanged,
  normalizeFormattedMarkdown,
  validateFormattedMarkdown,
} from "./prompts.js";

export { runAiMarkdownFormat } from "./run.js";
export { runAiExperienceFieldsMarkdownFormat } from "./run-experience-fields-format.js";
export {
  formatMarkdownOnSave,
  formatExperienceFieldsOnSave,
  formatCompanyFieldsOnSave,
  type FormatExperienceFieldsOnSaveInput,
  type FormatExperienceFieldsOnSaveResult,
  type FormatCompanyFieldsOnSaveInput,
  type FormatCompanyFieldsOnSaveResult,
} from "./format-on-save.js";

export const AUTO_MARKDOWN_FORMAT_HINT =
  "Contents will be automatically converted to markdown format when you save.";

export function needsMarkdownFormatOnSave(
  current: string,
  stored: string | null | undefined,
): boolean {
  return current.trim() !== (stored ?? "").trim();
}

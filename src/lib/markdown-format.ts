export function needsMarkdownFormatOnSave(
  current: string,
  stored: string | null | undefined,
): boolean {
  return current.trim() !== (stored ?? "").trim();
}

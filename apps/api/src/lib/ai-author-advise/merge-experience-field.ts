function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  return value.trim();
}

/**
 * Merge existing field text with an AI delta for Quick Experience update placements.
 * Used by Quick Experience Suggestion preview (web) and available on the API for tests.
 */
export function mergeExperienceFieldUpdate(
  existing: string | null | undefined,
  delta: string | null | undefined,
): string {
  const existingText = trimField(existing);
  const deltaText = trimField(delta);

  if (!deltaText) {
    return existingText;
  }
  if (!existingText) {
    return deltaText;
  }
  if (existingText === deltaText || existingText.includes(deltaText)) {
    return existingText;
  }
  if (deltaText.includes(existingText)) {
    return deltaText;
  }
  return `${existingText}\n\n${deltaText}`;
}

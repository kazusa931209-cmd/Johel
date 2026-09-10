function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  return value.trim();
}

export type ExperienceFieldUpdateDisplay =
  | { kind: "empty" }
  | { kind: "unchanged"; merged: string }
  | { kind: "new_only"; text: string }
  | { kind: "append"; existing: string; addition: string }
  | { kind: "replacement"; existing: string; replacement: string };

/**
 * Split merged update preview text into existing vs suggested portions for display.
 * Mirrors mergeExperienceFieldUpdate append/replace rules.
 */
export function splitExperienceFieldUpdateDisplay(
  existing: string | null | undefined,
  delta: string | null | undefined,
  merged: string | null | undefined,
): ExperienceFieldUpdateDisplay {
  const existingText = trimField(existing);
  const deltaText = trimField(delta);
  const mergedText = trimField(merged);

  if (!mergedText) {
    return { kind: "empty" };
  }
  if (!deltaText) {
    return { kind: "unchanged", merged: mergedText };
  }
  if (!existingText) {
    return { kind: "new_only", text: mergedText };
  }
  if (mergedText === existingText) {
    return { kind: "unchanged", merged: mergedText };
  }
  if (existingText === deltaText || existingText.includes(deltaText)) {
    return { kind: "unchanged", merged: mergedText };
  }
  if (mergedText === deltaText || deltaText.includes(existingText)) {
    return {
      kind: "replacement",
      existing: existingText,
      replacement: mergedText,
    };
  }
  if (mergedText === `${existingText}\n\n${deltaText}`) {
    return {
      kind: "append",
      existing: existingText,
      addition: deltaText,
    };
  }

  return {
    kind: "replacement",
    existing: existingText,
    replacement: mergedText,
  };
}

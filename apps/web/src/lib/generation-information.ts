export function formatGenerationInformation(parts: {
  profileName?: string | null;
  jdCompanyName?: string;
  jdJobRole?: string;
}): string {
  const segments = [
    parts.profileName?.trim(),
    parts.jdCompanyName?.trim(),
    parts.jdJobRole?.trim(),
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(" · ") : "—";
}

type ParsedJob = {
  jdCompanyName: string;
  jdJobRole: string;
};

export function parseGenerationJobJson(jobJson: string): ParsedJob {
  try {
    const parsed = JSON.parse(jobJson) as Record<string, unknown>;
    return {
      jdCompanyName:
        typeof parsed.jdCompanyName === "string" ? parsed.jdCompanyName : "",
      jdJobRole: typeof parsed.jdJobRole === "string" ? parsed.jdJobRole : "",
    };
  } catch {
    return { jdCompanyName: "", jdJobRole: "" };
  }
}

export function parseGenerationCombinePlatform(combineJson: string): string {
  try {
    const parsed = JSON.parse(combineJson) as Record<string, unknown>;
    const platform =
      typeof parsed.platform === "string" ? parsed.platform.trim() : "";
    return platform;
  } catch {
    return "";
  }
}

export function parseGenerationCombineProfileId(
  combineJson: string,
): string | null {
  try {
    const parsed = JSON.parse(combineJson) as Record<string, unknown>;
    const profileId =
      typeof parsed.profileId === "string" ? parsed.profileId.trim() : "";
    return profileId || null;
  } catch {
    return null;
  }
}

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

export function formatGeneralResumeInformation(parts: {
  platform?: string;
  profileName?: string | null;
}): string {
  const segments = [parts.platform?.trim(), parts.profileName?.trim()].filter(
    Boolean,
  );

  return segments.length > 0 ? segments.join(" · ") : "—";
}

export function formatProfileName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

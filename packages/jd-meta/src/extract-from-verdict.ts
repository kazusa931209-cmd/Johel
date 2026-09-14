export type JdMeta = {
  jdCompanyName: string;
  jdJobRole: string;
};

const EMPTY_META: JdMeta = { jdCompanyName: "", jdJobRole: "" };

const MISSING_VALUES = new Set([
  "",
  "not found",
  "not specified",
  "n/a",
  "none",
]);

function normalizeExtractedValue(raw: string): string {
  const trimmed = raw.trim();
  if (MISSING_VALUES.has(trimmed.toLowerCase())) {
    return "";
  }
  return trimmed;
}

function extractLabeledValue(
  sectionBody: string,
  labelPattern: RegExp,
): string {
  const lines = sectionBody.split("\n");
  for (const line of lines) {
    const match = line.match(labelPattern);
    if (!match) continue;
    return normalizeExtractedValue(match[1] ?? "");
  }
  return "";
}

function extractSection(markdown: string, heading: string): string | null {
  const lines = markdown.split("\n");
  const target = `## ${heading}`.trim().toLowerCase();
  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.trim().toLowerCase() === target) {
      startIndex = index + 1;
      break;
    }
  }

  if (startIndex === -1) {
    return null;
  }

  const bodyLines: string[] = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^##\s+/.test(line)) {
      break;
    }
    bodyLines.push(line);
  }

  return bodyLines.join("\n");
}

/**
 * Parses JD company name and job role from Verdict Markdown produced by the
 * default prompt structure (`## Role` / `- Title:`, `## Company & Contacts` /
 * `- Company name:`).
 */
export function extractJdMetaFromVerdictMarkdown(markdown: string): JdMeta {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return { ...EMPTY_META };
  }

  const roleSection = extractSection(trimmed, "Role");
  const companySection = extractSection(trimmed, "Company & Contacts");

  let jdCompanyName = companySection
    ? extractLabeledValue(companySection, /^-\s*Company name:\s*(.*)$/i)
    : "";

  if (!jdCompanyName && companySection) {
    jdCompanyName = extractLabeledValue(
      companySection,
      /^Company name:\s*(.*)$/i,
    );
  }

  let jdJobRole = roleSection
    ? extractLabeledValue(roleSection, /^-\s*Title:\s*(.*)$/i)
    : "";

  if (!jdJobRole && roleSection) {
    jdJobRole = extractLabeledValue(roleSection, /^Title:\s*(.*)$/i);
  }

  return { jdCompanyName, jdJobRole };
}

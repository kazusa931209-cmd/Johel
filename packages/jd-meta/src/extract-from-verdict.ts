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

const ROLE_SECTION_HEADINGS = ["Role", "Job Role", "Position"];
const COMPANY_SECTION_HEADINGS = [
  "Company & Contacts",
  "Company and Contacts",
  "Company",
];

function normalizeExtractedValue(raw: string): string {
  const trimmed = stripInlineMarkdown(raw);
  if (MISSING_VALUES.has(trimmed.toLowerCase())) {
    return "";
  }
  return trimmed;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function normalizeHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ");
}

function normalizeLineForLabelMatch(line: string): string {
  return stripInlineMarkdown(line).trim();
}

function extractLabeledValue(
  sectionBody: string,
  labelPatterns: RegExp[],
): string {
  const lines = sectionBody.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const normalized = normalizeLineForLabelMatch(lines[index] ?? "");
    for (const labelPattern of labelPatterns) {
      const match = normalized.match(labelPattern);
      if (!match) continue;

      const inline = normalizeExtractedValue(match[1] ?? "");
      if (inline) {
        return inline;
      }

      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const rawNext = lines[nextIndex] ?? "";
        const trimmedNext = rawNext.trim();
        if (!trimmedNext) continue;
        if (/^#{1,6}\s+/.test(trimmedNext)) break;
        if (/^-\s+/.test(trimmedNext)) break;
        return normalizeExtractedValue(normalizeLineForLabelMatch(rawNext));
      }

      return "";
    }
  }
  return "";
}

function extractSection(markdown: string, headings: string[]): string | null {
  const lines = markdown.split("\n");
  const targets = new Set(headings.map((heading) => normalizeHeading(heading)));
  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (!headingMatch) continue;
    const heading = normalizeHeading(headingMatch[1] ?? "");
    if (targets.has(heading)) {
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
    if (/^#{1,6}\s+/.test(line.trim())) {
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

  const roleSection = extractSection(trimmed, ROLE_SECTION_HEADINGS);
  const companySection = extractSection(trimmed, COMPANY_SECTION_HEADINGS);

  const jdJobRole = roleSection
    ? extractLabeledValue(roleSection, [
        /^-\s*Title:\s*(.*)$/i,
        /^Title:\s*(.*)$/i,
      ])
    : "";

  const jdCompanyName = companySection
    ? extractLabeledValue(companySection, [
        /^-\s*Company name:\s*(.*)$/i,
        /^Company name:\s*(.*)$/i,
      ])
    : "";

  return { jdCompanyName, jdJobRole };
}

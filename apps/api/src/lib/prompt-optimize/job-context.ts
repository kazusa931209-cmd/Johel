export function extractMarkdownHeadings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) =>
    match[1].trim(),
  );
}

export function formatJobContextBlock(jobContext: string): string {
  const trimmed = jobContext.trim();
  const headings = extractMarkdownHeadings(trimmed);
  const headingList =
    headings.length > 0
      ? `### Headings in this job context\n${headings
          .map((heading) => `- ${heading}`)
          .join("\n")}\n\n`
      : "";
  return `## Job context\n\n${headingList}${trimmed}`;
}

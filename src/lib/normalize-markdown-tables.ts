/**
 * Models sometimes emit GFM table rows on one line (`| a | b | | c | d |`).
 * Row boundaries are `| |` (end of row pipe, next row pipe); cell boundaries are ` | `.
 */
export function normalizeGluedMarkdownTableRows(markdown: string): string {
  return markdown.replace(/\|\s+\|/g, "|\n|");
}

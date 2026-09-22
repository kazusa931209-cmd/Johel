import type { NoiseFilter, NoiseFilterContext } from "../types";

const IMAGE_MD_RE = /!\[[^\]]*\]\([^)]+\)/g;
const IMAGE_LABEL_LINK_RE = /\[image\]\([^)]+\)/gi;
const MD_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function isLikelyNavLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.length <= 2 && !/[\u4e00-\u9fff]/.test(trimmed)) return true;
  return false;
}

function filterMarkdown(input: string): string {
  let text = input.replace(IMAGE_MD_RE, " ");
  text = text.replace(IMAGE_LABEL_LINK_RE, " ");

  text = text.replace(MD_LINK_RE, (_match, label: string) => {
    const visible = String(label).trim();
    if (isLikelyNavLabel(visible) || /^image$/i.test(visible)) {
      return "";
    }
    return visible;
  });

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class MarkdownFilter implements NoiseFilter {
  name = "markdown";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: filterMarkdown(context.text),
    };
  }
}

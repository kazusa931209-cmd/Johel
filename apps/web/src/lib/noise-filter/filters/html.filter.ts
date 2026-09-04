import { parse } from "node-html-parser";
import type { NoiseFilter, NoiseFilterContext } from "../types";

const REMOVE_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "template",
]);

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "aside",
  "nav",
  "li",
  "ul",
  "ol",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "tr",
  "br",
  "hr",
  "blockquote",
  "pre",
]);

const COMMENT_RE = /<!--[\s\S]*?-->/g;
const ENTITY_RE = /&(#x?[0-9a-f]+|[a-z]+);/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntity(match: string, body: string): string {
  const lower = body.toLowerCase();
  if (lower.startsWith("#x")) {
    const code = Number.parseInt(lower.slice(2), 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  }
  if (lower.startsWith("#")) {
    const code = Number.parseInt(lower.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  }
  return NAMED_ENTITIES[lower] ?? match;
}

function looksLikeHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input) || input.includes("<!--");
}

function stripWithRegex(input: string): string {
  let text = input.replace(COMMENT_RE, " ");
  text = text.replace(
    /<(script|style|noscript|svg|canvas|iframe|template)\b[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(ENTITY_RE, decodeEntity);
  return text;
}

function extractVisibleText(node: {
  nodeType: number;
  tagName?: string;
  rawText?: string;
  childNodes?: unknown[];
  remove?: () => void;
}): string {
  const parts: string[] = [];

  function walk(n: {
    nodeType: number;
    tagName?: string;
    rawText?: string;
    text?: string;
    childNodes?: { nodeType: number; tagName?: string; rawText?: string; text?: string; childNodes?: unknown[] }[];
  }) {
    if (n.nodeType === 3) {
      parts.push(n.text ?? n.rawText ?? "");
      return;
    }
    if (n.nodeType !== 1) return;

    const tag = (n.tagName ?? "").toLowerCase();
    if (REMOVE_TAGS.has(tag)) return;

    if (tag === "br" || tag === "hr") {
      parts.push("\n");
      return;
    }

    const children = n.childNodes ?? [];
    for (const child of children) {
      walk(child as typeof n);
    }

    if (BLOCK_TAGS.has(tag)) {
      parts.push("\n");
    }
  }

  walk(node as Parameters<typeof walk>[0]);
  return parts.join("");
}

function extractFromHtml(input: string): string {
  try {
    const withoutComments = input.replace(COMMENT_RE, " ");
    const root = parse(withoutComments, {
      comment: false,
      blockTextElements: {
        script: true,
        style: true,
        noscript: true,
      },
    });

    for (const tag of REMOVE_TAGS) {
      root.querySelectorAll(tag).forEach((el) => el.remove());
    }

    const text = extractVisibleText(root as never);
    return text.replace(ENTITY_RE, decodeEntity);
  } catch {
    return stripWithRegex(input);
  }
}

export class HtmlFilter implements NoiseFilter {
  name = "html";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    if (!looksLikeHtml(context.text)) {
      return context;
    }

    const extracted = extractFromHtml(context.text)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      ...context,
      text: extracted,
    };
  }
}

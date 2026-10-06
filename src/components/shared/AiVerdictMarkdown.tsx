import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeGluedMarkdownTableRows } from "@/lib/normalize-markdown-tables";

type AiVerdictMarkdownProps = {
  markdown: string;
};

export function AiVerdictMarkdown({ markdown }: AiVerdictMarkdownProps) {
  const source = normalizeGluedMarkdownTableRows(markdown);

  return (
    <div
      className={[
        "prose prose-sm max-w-none overflow-x-auto",
        "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2",
        "[&_h2]:text-base [&_h2]:font-semibold",
        "[&_h2:first-child]:mt-0",
        "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-medium",
        "[&_h3+p]:my-1 [&_h3+p]:text-muted",
        "[&_h3+ul]:my-1 [&_h3+ul]:ml-4 [&_h3+ul]:list-disc",
        "[&_li]:my-0.5",
        "[&_p]:my-1.5",
        "[&_ul]:my-2",
        "[&_table]:my-3 [&_th]:px-2 [&_th]:text-left [&_td]:px-2 [&_td]:align-top",
      ].join(" ")}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}

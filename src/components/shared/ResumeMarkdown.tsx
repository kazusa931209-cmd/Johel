import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeGluedMarkdownTableRows } from "@/lib/normalize-markdown-tables";

type ResumeMarkdownProps = {
  markdown: string;
};

export function ResumeMarkdown({ markdown }: ResumeMarkdownProps) {
  const source = normalizeGluedMarkdownTableRows(markdown);

  return (
    <div
      className={[
        "prose prose-sm max-w-none overflow-x-auto",
        "[&_h1]:mb-1 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1",
        "[&_h2]:text-base [&_h2]:font-semibold",
        "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-medium",
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

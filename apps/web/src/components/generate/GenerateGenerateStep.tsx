"use client";

import { useMemo, useState } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { useToast } from "@/components/app/ToastProvider";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";

type GenerateGenerateStepProps = {
  resume: GeneratedResume | null;
  onPrev: () => void;
};

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GenerateGenerateStep({
  resume,
  onPrev,
}: GenerateGenerateStepProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const markdown = useMemo(
    () => (resume ? resumeToMarkdown(resume) : ""),
    [resume],
  );

  async function onDownload() {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const { buildResumeDocxBlob } = await import("@johel/resume/docx");
      const blob = await buildResumeDocxBlob(resume);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const baseName = sanitizeFileName(resume.header.name) || "resume";
      anchor.href = url;
      anchor.download = `${baseName}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Resume downloaded.", "success");
    } catch {
      toast("DOCX download failed.", "error");
    } finally {
      setDownloading(false);
    }
  }

  if (!resume) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
          No generated resume is available for this session. Go back to PCEW and
          run resume generation again.
        </div>
        <div className="flex justify-start border-t border-border pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted"
          >
            Prev
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => void onDownload()}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          {downloading ? "Downloading…" : "Download"}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          Generated Resume
        </h2>
        <div className="rounded-md border border-border bg-background px-4 py-4">
          <ResumeMarkdown markdown={markdown} />
        </div>
      </div>
    </div>
  );
}

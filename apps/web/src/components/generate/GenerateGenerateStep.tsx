"use client";

import { useCallback, useMemo, useState } from "react";
import { resumeToMarkdown } from "@johel/resume";
import type { GeneratedResume } from "@johel/resume";
import { downloadResumeDocx } from "@/lib/api";
import { useToast } from "@/components/app/ToastProvider";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

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

  const onDownload = useCallback(async () => {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const res = await downloadResumeDocx(resume);
      if (!res.blob) {
        toast(res.error ?? "DOCX download failed.", "error");
        return;
      }

      const url = URL.createObjectURL(res.blob);
      const anchor = document.createElement("a");
      const baseName =
        res.fileName?.replace(/\.docx$/i, "") ||
        sanitizeFileName(resume.header.name) ||
        "resume";
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
  }, [downloading, resume, toast]);

  useRegisterGenerateStepNav({
    onPrev,
    onDownload: resume ? () => void onDownload() : undefined,
    downloadBusy: downloading,
  });

  if (!resume) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        No generated resume is available for this session. Go back to Workflow
        and run resume generation again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-center text-lg font-semibold tracking-tight">
        Generated Resume
      </h2>
      <div className="rounded-md border border-border bg-background px-4 py-4">
        <ResumeMarkdown markdown={markdown} />
      </div>
    </div>
  );
}

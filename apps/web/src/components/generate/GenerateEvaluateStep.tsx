"use client";

import { useCallback, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { downloadResumeDocx } from "@/lib/api";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { useRegisterGenerateStepNav } from "@/components/generate/GenerateStepNav";

type GenerateEvaluateStepProps = {
  resume: GeneratedResume | null;
  evaluationMarkdown: string | null;
  onPrev: () => void;
};

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GenerateEvaluateStep({
  resume,
  evaluationMarkdown,
  onPrev,
}: GenerateEvaluateStepProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

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

  if (!evaluationMarkdown) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        No evaluation is available for this session. Go back to Generate and
        run evaluation again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-center text-lg font-semibold tracking-tight">
        Evaluation Result
      </h2>
      <div className="rounded-md border border-border bg-background px-4 py-4">
        <AiVerdictMarkdown markdown={evaluationMarkdown} />
      </div>
    </div>
  );
}

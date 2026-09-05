"use client";

import { useCallback, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { buildResumeDocxFileName } from "@johel/resume";
import { downloadResumeDocx } from "@/lib/api";
import { useToast } from "@/components/app/ToastProvider";

export function useResumeDocxDownload(
  resume: GeneratedResume | null,
  workflowName?: string,
) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const res = await downloadResumeDocx(resume, workflowName);
      if (!res.blob) {
        toast(res.error ?? "DOCX download failed.", "error");
        return;
      }

      const url = URL.createObjectURL(res.blob);
      const anchor = document.createElement("a");
      const fileName =
        res.fileName ?? buildResumeDocxFileName(resume, workflowName);
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Resume downloaded.", "success");
    } catch {
      toast("DOCX download failed.", "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, resume, toast, workflowName]);

  return { onDownload, downloading };
}

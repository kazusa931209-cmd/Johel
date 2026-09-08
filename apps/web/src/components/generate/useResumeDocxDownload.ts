"use client";

import { useCallback, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { buildResumeDocxFileName } from "@johel/resume";
import { downloadResumeDocx } from "@/lib/api";
import { useToast } from "@/components/app/ToastProvider";
import { useT } from "@/components/app/LocaleProvider";

export function useResumeDocxDownload(
  resume: GeneratedResume | null,
  runLabel?: string,
) {
  const { toast } = useToast();
  const t = useT();
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const res = await downloadResumeDocx(resume, runLabel);
      if (!res.blob) {
        toast(res.error ?? t("generate.download.failed"), "error");
        return;
      }

      const url = URL.createObjectURL(res.blob);
      const anchor = document.createElement("a");
      const fileName =
        res.fileName ?? buildResumeDocxFileName(resume, runLabel);
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      toast(t("generate.download.success"), "success");
    } catch {
      toast(t("generate.download.failed"), "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, resume, runLabel, t, toast]);

  return { onDownload, downloading };
}

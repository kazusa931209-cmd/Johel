"use client";

import { useCallback, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { buildResumeExportFileName } from "@johel/resume";
import {
  downloadResumeDocx,
  downloadResumePdf,
  resolveDownloadFormat,
  type ResumeDownloadLabel,
} from "@/lib/api";
import { loadGenerationProcess } from "@/lib/cached-settings";
import { useToast } from "@/components/app/ToastProvider";
import { useT } from "@/components/app/LocaleProvider";

type UseResumeDownloadOptions = {
  onDownloaded?: () => void | Promise<void>;
};

export function useResumeDownload(
  resume: GeneratedResume | null,
  label?: ResumeDownloadLabel,
  options?: UseResumeDownloadOptions,
) {
  const { toast } = useToast();
  const t = useT();
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const settingsRes = await loadGenerationProcess();
      const format =
        settingsRes.data != null
          ? resolveDownloadFormat(settingsRes.data)
          : "docx";
      const download =
        format === "pdf" ? downloadResumePdf : downloadResumeDocx;
      const res = await download(resume, label);
      if (!res.blob) {
        toast(res.error ?? t("generate.download.failed"), "error");
        return;
      }

      const url = URL.createObjectURL(res.blob);
      const anchor = document.createElement("a");
      const fileName =
        res.fileName ?? buildResumeExportFileName(label ?? {}, format);
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      toast(t("generate.download.success"), "success");
      await options?.onDownloaded?.();
    } catch {
      toast(t("generate.download.failed"), "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, label, options, resume, t, toast]);

  return { onDownload, downloading };
}

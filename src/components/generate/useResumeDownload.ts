"use client";

import { useCallback, useState } from "react";
import type { GeneratedResume } from "@johel/resume";
import { buildResumeExportFileName } from "@johel/resume";
import {
  downloadResumeDocx,
  downloadResumePdf,
  downloadResumeZip,
  isPdfDownloadAvailable,
  type DownloadFormat,
  type ResumeDownloadLabel,
  type ResumeLanguage,
} from "@/lib/api";
import { useToast } from "@/components/app/ToastProvider";
import { useT } from "@/components/app/LocaleProvider";

type UseResumeDownloadOptions = {
  resumeLanguage?: ResumeLanguage;
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
  const pdfDisabled = !isPdfDownloadAvailable(options?.resumeLanguage ?? "en");

  const downloadAs = useCallback(
    async (format: DownloadFormat) => {
      if (!resume || downloading) return;
      if (format === "pdf" && pdfDisabled) return;

      setDownloading(true);
      try {
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
    },
    [downloading, label, options, pdfDisabled, resume, t, toast],
  );

  const downloadAsZip = useCallback(async () => {
    if (!resume || downloading || pdfDisabled) return;

    setDownloading(true);
    try {
      const res = await downloadResumeZip(resume, label);
      if (!res.blob) {
        toast(res.error ?? t("generate.download.failed"), "error");
        return;
      }

      const url = URL.createObjectURL(res.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = res.fileName ?? "resume.zip";
      anchor.click();
      URL.revokeObjectURL(url);
      toast(t("generate.download.success"), "success");
      await options?.onDownloaded?.();
    } catch {
      toast(t("generate.download.failed"), "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, label, options, pdfDisabled, resume, t, toast]);

  return { downloadAs, downloadAsZip, downloading, pdfDisabled };
}

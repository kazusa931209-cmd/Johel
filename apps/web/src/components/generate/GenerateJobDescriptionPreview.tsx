"use client";

import { useT } from "@/components/app/LocaleProvider";
import { noiseFilter } from "@/lib/jobNoiseFilter";

type GenerateJobDescriptionPreviewProps = {
  jobText: string;
};

export function GenerateJobDescriptionPreview({
  jobText,
}: GenerateJobDescriptionPreviewProps) {
  const t = useT();
  const filtered = noiseFilter(jobText.trim()).text;

  if (!filtered) {
    return (
      <p className="text-sm text-muted">{t("generate.previous.jobEmpty")}</p>
    );
  }

  return (
    <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
      {filtered}
    </pre>
  );
}

"use client";

import { useT } from "@/components/app/LocaleProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { splitExperienceFieldUpdateDisplay } from "@/lib/experience-field-update-display";

type ExperienceSuggestionUpdateFieldProps = {
  label: string;
  existing: string | null | undefined;
  delta: string | null | undefined;
  merged: string | null | undefined;
};

const OUTLINE_BOUNDARY_CLASS =
  "rounded-md border border-border px-3 py-3 text-sm bg-muted/20";

function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  return value.trim();
}

function SuggestedBlock({
  sublabel,
  markdown,
}: {
  sublabel: string;
  markdown: string;
}) {
  return (
    <div className={OUTLINE_BOUNDARY_CLASS}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {sublabel}
      </p>
      <div className="mt-2">
        <AiVerdictMarkdown markdown={markdown} />
      </div>
    </div>
  );
}

export function ExperienceSuggestionUpdateField({
  label,
  existing,
  delta,
  merged,
}: ExperienceSuggestionUpdateFieldProps) {
  const t = useT();

  if (!trimField(delta)) {
    return null;
  }

  const display = splitExperienceFieldUpdateDisplay(existing, delta, merged);

  if (display.kind === "empty" || display.kind === "unchanged") {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="font-medium">{label}</p>

      {display.kind === "new_only" ? (
        <SuggestedBlock
          sublabel={t("crud.experiences.advisor.fieldSuggestedAddition")}
          markdown={display.text}
        />
      ) : null}

      {display.kind === "append" ? (
        <>
          <AiVerdictMarkdown markdown={display.existing} />
          <SuggestedBlock
            sublabel={t("crud.experiences.advisor.fieldSuggestedAddition")}
            markdown={display.addition}
          />
        </>
      ) : null}

      {display.kind === "replacement" ? (
        <>
          <AiVerdictMarkdown markdown={display.existing} />
          <SuggestedBlock
            sublabel={t("crud.experiences.advisor.fieldSuggestedChange")}
            markdown={display.replacement}
          />
        </>
      ) : null}
    </div>
  );
}

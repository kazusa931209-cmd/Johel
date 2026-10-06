"use client";

import { useT } from "@/components/app/LocaleProvider";

type CombineCompanyContextFieldsReadOnlyProps = {
  roleContext: string;
  keywordContext: string;
};

export function CombineCompanyContextFieldsReadOnly({
  roleContext,
  keywordContext,
}: CombineCompanyContextFieldsReadOnlyProps) {
  const t = useT();

  return (
    <>
      <div className="flex items-center gap-3 text-sm">
        <span className="w-36 shrink-0">
          {t("generate.combine.roleContext")}
        </span>
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-muted">
          {roleContext.trim()
            ? roleContext
            : t("generate.combine.readOnlyContextEmpty")}
        </p>
      </div>

      {keywordContext.trim() ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="w-36 shrink-0">
            {t("generate.combine.keywordContext")}
          </span>
          <p className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-muted">
            {keywordContext}
          </p>
        </div>
      ) : null}
    </>
  );
}

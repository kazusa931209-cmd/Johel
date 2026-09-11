"use client";

import { useT } from "@/components/app/LocaleProvider";

type CombineSuggestFooterProps = {
  suggestSucceeded: boolean;
  suggesting: boolean;
  disabled: boolean;
  onRequestSuggest: () => void;
};

export function CombineSuggestFooter({
  suggestSucceeded,
  suggesting,
  disabled,
  onRequestSuggest,
}: CombineSuggestFooterProps) {
  const t = useT();

  return (
    <div className="flex w-full items-center gap-3">
      {suggestSucceeded ? (
        <div
          role="alert"
          className="min-w-0 flex-1 rounded-md border border-border bg-toast-success-bg px-3 py-2 text-sm text-toast-success-fg"
        >
          {t("generate.combine.suggestRunGuidance")}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRequestSuggest}
        disabled={suggesting || disabled}
        className={`shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60${
          suggestSucceeded ? "" : " ml-auto"
        }`}
      >
        {suggesting
          ? t("generate.combine.suggesting")
          : t("generate.combine.suggestExperiences")}
      </button>
    </div>
  );
}

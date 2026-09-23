"use client";

import { ChevronDownIcon } from "@/components/shared/icons";
import type { SelectHTMLAttributes } from "react";

const selectClassName =
  "w-full appearance-none rounded-md border border-border bg-background py-2 pr-9 pl-3 outline-none focus:border-muted disabled:opacity-60";

type SettingsSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

/** Native select styled like Settings → Generation dropdowns. */
export function SettingsSelect({
  wrapperClassName,
  className,
  ...props
}: SettingsSelectProps) {
  return (
    <div className={wrapperClassName ?? "relative"}>
      <select
        {...props}
        className={className ? `${selectClassName} ${className}` : selectClassName}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

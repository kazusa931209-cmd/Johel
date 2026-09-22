"use client";

import Link from "next/link";
import { useT } from "@/components/app/LocaleProvider";

export type MissingPrerequisite = {
  label: string;
  href: string;
};

type GeneratePrerequisitesProps = {
  missing: MissingPrerequisite[];
};

export function GeneratePrerequisites({ missing }: GeneratePrerequisitesProps) {
  const t = useT();

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        role="alert"
        className="w-full max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold tracking-tight">
          {t("generate.prerequisites.title")}
        </h2>
        <ul className="space-y-2 text-sm">
          {missing.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <span>
                {t("generate.prerequisites.missing", { label: item.label })}
              </span>
              <Link
                href={item.href}
                className="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
              >
                {t("generate.prerequisites.open", { label: item.label })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

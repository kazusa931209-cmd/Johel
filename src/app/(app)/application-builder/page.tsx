"use client";

import { useT } from "@/components/app/LocaleProvider";

export default function ApplicationBuilderPage() {
  const t = useT();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("nav.sidebar.applicationBuilder")}
      </h1>
    </section>
  );
}

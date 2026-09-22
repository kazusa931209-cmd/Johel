"use client";

import { useT } from "@/components/app/LocaleProvider";

export default function ApplicationsPage() {
  const t = useT();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("nav.sidebar.applications")}
      </h1>
    </section>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { getStudioPageTitleKey } from "@/lib/studio-page-title";

export function StudioPageTitle() {
  const pathname = usePathname();
  const t = useT();
  const titleKey = getStudioPageTitleKey(pathname);

  return (
    <h1 className="min-w-0 flex-1 truncate text-left text-lg font-semibold tracking-tight">
      {t(titleKey)}
    </h1>
  );
}

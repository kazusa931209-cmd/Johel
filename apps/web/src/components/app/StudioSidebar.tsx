"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";

function sectionLabelClass() {
  return "px-3 py-2 text-xs font-semibold tracking-wide text-muted";
}

function navLinkClass(active: boolean) {
  return `rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
    active
      ? "bg-surface-muted font-medium text-foreground"
      : "text-muted hover:bg-surface-muted hover:text-foreground"
  }`;
}

export function StudioSidebar({ open }: { open: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const profilesActive =
    pathname === "/profiles" || pathname.startsWith("/profiles/");
  const companiesActive =
    pathname === "/companies" || pathname.startsWith("/companies/");
  const experiencesActive =
    pathname === "/experiences" || pathname.startsWith("/experiences/");
  const environmentActive =
    pathname === "/settings" ||
    pathname === "/settings/environment" ||
    pathname.startsWith("/settings/environment/");
  const generationActive =
    pathname === "/settings/generation" ||
    pathname.startsWith("/settings/generation/");
  const promptsActive =
    pathname === "/settings/prompts" ||
    pathname.startsWith("/settings/prompts/") ||
    pathname === "/prompts" ||
    pathname.startsWith("/prompts/") ||
    pathname === "/verdict" ||
    pathname.startsWith("/verdict/");
  const generateActive = pathname === "/";

  return (
    <aside
      id="studio-sidebar"
      aria-hidden={!open}
      className={
        open
          ? "flex h-full w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar"
          : "hidden"
      }
    >
      <nav className="flex flex-col gap-1 p-3">
        <div className={sectionLabelClass()}>{t("nav.sidebar.workspace")}</div>
        <Link href="/profiles" className={navLinkClass(profilesActive)}>
          {t("nav.sidebar.profiles")}
        </Link>
        <Link href="/companies" className={navLinkClass(companiesActive)}>
          {t("nav.sidebar.companies")}
        </Link>
        <Link href="/experiences" className={navLinkClass(experiencesActive)}>
          {t("nav.sidebar.experiences")}
        </Link>

        <div className={`${sectionLabelClass()} mt-2`}>{t("nav.sidebar.run")}</div>
        <Link href="/" className={navLinkClass(generateActive)}>
          {t("nav.sidebar.generate")}
        </Link>

        <div className={`${sectionLabelClass()} mt-2`}>
          {t("nav.sidebar.settings")}
        </div>
        <Link
          href="/settings/environment"
          className={navLinkClass(environmentActive)}
        >
          {t("nav.sidebar.environment")}
        </Link>
        <Link
          href="/settings/generation"
          className={navLinkClass(generationActive)}
        >
          {t("nav.sidebar.generation")}
        </Link>
        <Link href="/settings/prompts" className={navLinkClass(promptsActive)}>
          {t("nav.sidebar.prompts")}
        </Link>
      </nav>
    </aside>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { MenuIcon } from "@/components/shared/icons";

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

export function StudioSidebar({
  open,
  motion = true,
  onToggleSidebar,
}: {
  open: boolean;
  motion?: boolean;
  onToggleSidebar: () => void;
}) {
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
  const historyActive =
    pathname === "/history" || pathname.startsWith("/history/");

  return (
    <aside
      id="studio-sidebar"
      className={[
        "studio-sidebar flex h-full shrink-0 flex-col overflow-hidden",
        open ? "studio-sidebar-open" : "",
        motion ? "studio-sidebar-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-r border-border bg-sidebar px-4">
        {open ? (
          <Link
            href="/"
            aria-label={t("nav.brand")}
            className="flex min-w-0 items-center gap-2 rounded-md hover:opacity-90"
          >
            <Image
              src="/logo-header.png"
              alt={t("nav.brand")}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0"
              priority
            />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={
            open ? t("nav.header.collapseSidebar") : t("nav.header.openSidebar")
          }
          aria-expanded={open}
          aria-controls="studio-sidebar-nav"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-surface-muted"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        id="studio-sidebar-nav"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className="studio-sidebar-nav min-h-0 flex-1 overflow-hidden border-r border-border bg-sidebar"
      >
        <nav className="studio-sidebar-inner h-full overflow-y-auto">
          <div className="flex flex-col gap-1 p-3">
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

            <div className={`${sectionLabelClass()} mt-2`}>
              {t("nav.sidebar.run")}
            </div>
            <Link href="/" className={navLinkClass(generateActive)}>
              {t("nav.sidebar.generate")}
            </Link>
            <Link href="/history" className={navLinkClass(historyActive)}>
              {t("nav.sidebar.history")}
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
          </div>
        </nav>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const profilesActive =
    pathname === "/profiles" || pathname.startsWith("/profiles/");
  const companiesActive =
    pathname === "/companies" || pathname.startsWith("/companies/");
  const experiencesActive =
    pathname === "/experiences" || pathname.startsWith("/experiences/");
  const workflowsActive =
    pathname === "/workflows" || pathname.startsWith("/workflows/");
  const environmentActive =
    pathname === "/settings" ||
    pathname === "/settings/environment" ||
    pathname.startsWith("/settings/environment/");
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
        <div className={sectionLabelClass()}>Workspace</div>
        <Link href="/profiles" className={navLinkClass(profilesActive)}>
          Profiles
        </Link>
        <Link href="/companies" className={navLinkClass(companiesActive)}>
          Companies
        </Link>
        <Link href="/experiences" className={navLinkClass(experiencesActive)}>
          Experiences
        </Link>
        <Link href="/workflows" className={navLinkClass(workflowsActive)}>
          Workflows
        </Link>

        <div className={`${sectionLabelClass()} mt-2`}>Run</div>
        <Link href="/" className={navLinkClass(generateActive)}>
          Generate
        </Link>

        <div className={`${sectionLabelClass()} mt-2`}>Settings</div>
        <Link
          href="/settings/environment"
          className={navLinkClass(environmentActive)}
        >
          Environment
        </Link>
        <Link href="/settings/prompts" className={navLinkClass(promptsActive)}>
          Prompts
        </Link>
      </nav>
    </aside>
  );
}

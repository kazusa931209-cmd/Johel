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

export function StudioSidebar() {
  const pathname = usePathname();
  const profilesActive =
    pathname === "/profiles" || pathname.startsWith("/profiles/");
  const companiesActive =
    pathname === "/companies" || pathname.startsWith("/companies/");
  const experiencesActive =
    pathname === "/experiences" || pathname.startsWith("/experiences/");
  const workflowsActive =
    pathname === "/workflows" || pathname.startsWith("/workflows/");
  const promptsActive =
    pathname === "/prompts" ||
    pathname.startsWith("/prompts/") ||
    pathname === "/verdict" ||
    pathname.startsWith("/verdict/");
  const generateActive = pathname === "/";
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar">
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
        <Link href="/prompts" className={navLinkClass(promptsActive)}>
          Prompts
        </Link>

        <div className={`${sectionLabelClass()} mt-2`}>Run</div>
        <Link href="/" className={navLinkClass(generateActive)}>
          Generate
        </Link>

        <Link
          href="/settings"
          className={`mt-2 rounded-md px-3 py-2 text-sm transition-colors ${
            settingsActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const verdictActive =
    pathname === "/verdict" || pathname.startsWith("/verdict/");
  const generateActive = pathname === "/";
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-sidebar">
      <nav className="flex flex-col gap-1 p-3">
        <div className="px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Workspace
        </div>
        <Link
          href="/profiles"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            profilesActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Profiles
        </Link>
        <Link
          href="/companies"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            companiesActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Companies
        </Link>
        <Link
          href="/experiences"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            experiencesActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Experiences
        </Link>
        <Link
          href="/workflows"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            workflowsActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Workflows
        </Link>
        <Link
          href="/verdict"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            verdictActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Verdict
        </Link>
        <Link
          href="/"
          className={`rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
            generateActive
              ? "bg-surface-muted font-medium text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
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

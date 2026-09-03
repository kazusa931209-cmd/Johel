"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudioSidebar() {
  const pathname = usePathname();
  const workflowsActive = pathname === "/workflows" || pathname.startsWith("/workflows/");
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

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuIcon } from "@/components/shared/icons";
import { logout } from "@/lib/api";
import { formatTokenUsed } from "@/lib/tokens";

type StudioHeaderProps = {
  userName: string;
  tokenUsage?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function StudioHeader({
  userName,
  tokenUsage = 0,
  sidebarOpen,
  onToggleSidebar,
}: StudioHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function onSignOut() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-header px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="studio-sidebar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-surface-muted"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="text-base font-semibold tracking-tight">JoHEL</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted" title="Token usage">
          Token Used: {formatTokenUsed(tokenUsage)}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-surface-muted"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            {userName}
          </button>
          {open ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
            >
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

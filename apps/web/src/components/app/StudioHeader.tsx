"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { StudioHeaderStatus } from "@/components/app/StudioHeaderStatus";
import { MenuIcon } from "@/components/shared/icons";
import { logout } from "@/lib/api";
import { clearAllCrudListCaches } from "@/lib/cached-crud-list";
import { clearAllSettingsCaches } from "@/lib/cached-settings";
import { clearPceCache } from "@/lib/pce";
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
  const t = useT();
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
    clearAllSettingsCaches();
    clearAllCrudListCaches();
    clearPceCache();
    router.replace("/login");
  }

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 border-b border-border bg-header px-4">
      <div className="flex min-w-0 items-center gap-2 justify-self-start">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={
            sidebarOpen
              ? t("nav.header.collapseSidebar")
              : t("nav.header.openSidebar")
          }
          aria-expanded={sidebarOpen}
          aria-controls="studio-sidebar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-surface-muted"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Link
          href="/"
          aria-label={t("nav.brand")}
          className="flex items-center gap-2 rounded-md hover:opacity-90"
        >
          <Image
            src="/logo-header.png"
            alt={t("nav.brand")}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0"
            priority
          />
        </Link>
      </div>
      <div className="min-w-0 justify-self-center px-2">
        <StudioHeaderStatus />
      </div>
      <div className="flex min-w-0 items-center justify-end gap-3 justify-self-end">
        <span
          className="text-sm text-muted"
          title={t("nav.header.tokenUsageTitle")}
        >
          {t("nav.header.tokenUsed", { count: formatTokenUsed(tokenUsage) })}
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
                href="/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm hover:bg-surface-muted"
              >
                {t("nav.header.account")}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                {t("nav.header.signOut")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

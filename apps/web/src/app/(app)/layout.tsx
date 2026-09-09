"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AiUsageProvider, useAiUsage } from "@/components/app/AiUsageProvider";
import { GenerateStatusProvider } from "@/components/app/GenerateStatusProvider";
import { useT } from "@/components/app/LocaleProvider";
import { StudioBottomFabCluster } from "@/components/app/StudioBottomFabCluster";
import { StudioHeader } from "@/components/app/StudioHeader";
import { StudioSidebar } from "@/components/app/StudioSidebar";
import type { User } from "@/lib/api";
import { loadMe } from "@/lib/cached-settings";
import { getStoredSidebar, persistSidebar } from "@/lib/sidebar";

function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const { tokenUsed } = useAiUsage();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setSidebarOpen(getStoredSidebar() === "open");
  }, []);

  function onToggleSidebar() {
    setSidebarOpen((current) => {
      const next = !current;
      persistSidebar(next ? "open" : "collapsed");
      return next;
    });
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <StudioHeader
        userName={user.loginId}
        tokenUsage={tokenUsed}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex min-h-0 flex-1">
        <StudioSidebar open={sidebarOpen} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <StudioBottomFabCluster />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMe().then((res) => {
      if (cancelled) return;
      if (!res.data) {
        router.replace("/login");
        return;
      }
      setUser(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted">
        {t("auth.checkingSession")}
      </main>
    );
  }

  return (
    <AiUsageProvider>
      <GenerateStatusProvider userId={user.id}>
        <AppShell user={user}>{children}</AppShell>
      </GenerateStatusProvider>
    </AiUsageProvider>
  );
}

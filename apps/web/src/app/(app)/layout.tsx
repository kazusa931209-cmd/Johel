"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudioHeader } from "@/components/StudioHeader";
import { StudioSidebar } from "@/components/StudioSidebar";
import { getMe, type User } from "@/lib/api";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe().then((res) => {
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
        Loading…
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <StudioHeader userName={user.email} />
      <div className="flex min-h-0 flex-1">
        <StudioSidebar />
        <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
